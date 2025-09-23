import { useCallback, useRef, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  payment_method?: string;
  payment_type?: string;
  form_field?: string;
  field_value?: string;
  error_type?: string;
  error_message?: string;
  interaction_type?: string;
  element_id?: string;
  element_text?: string;
  scroll_depth?: number;
  time_on_page?: number;
  time_to_action?: number;
  device_info?: {
    screen_width: number;
    screen_height: number;
    user_agent: string;
    language: string;
  };
  referrer?: string;
  url?: string;
  [key: string]: any;
}

export const useGranularAnalytics = () => {
  const sessionId = useRef(crypto.randomUUID());
  const pageLoadTime = useRef(Date.now());
  const lastScrollDepth = useRef(0);
  const formInteractionStartTime = useRef<number | null>(null);
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });

  // Removed page visibility and scroll tracking events - only payment events needed

  const trackEvent = useCallback(async (eventType: string, additionalData: AnalyticsData = {}) => {
    try {
      const eventData = {
        session_id: sessionId.current,
        event_type: eventType,
        user_name: userInfo.name || null,
        user_email: userInfo.email || null,
        payment_method: additionalData.payment_method || null,
        metadata: {
          timestamp: new Date().toISOString(),
          time_since_load: Date.now() - pageLoadTime.current,
          ...additionalData
        }
      };

      await supabase.functions.invoke('track-checkout-event', {
        body: eventData
      });

      console.log(`[GRANULAR-ANALYTICS] ${eventType}:`, additionalData);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, [userInfo.name, userInfo.email]);

  // Form field tracking functions
  const trackFormFieldFocus = useCallback((fieldName: string) => {
    formInteractionStartTime.current = Date.now();
    trackEvent('form_field_focused', { 
      form_field: fieldName,
      interaction_type: 'focus'
    });
  }, [trackEvent]);

  const trackFormFieldBlur = useCallback((fieldName: string, value: string) => {
    // Removido o tracking individual de campos para reduzir requests
    // Agora só trackamos quando o formulário é submetido
    console.log(`Field ${fieldName} completed with value: ${value ? 'filled' : 'empty'}`);
  }, []);

  const trackFormCompletion = useCallback((formData: any) => {
    trackEvent('form_all_fields_completed', {
      total_fields: Object.keys(formData).length,
      filled_fields: Object.values(formData).filter(v => v).length,
      completion_percentage: (Object.values(formData).filter(v => v).length / Object.keys(formData).length) * 100,
      fields_data: formData
    });
  }, [trackEvent]);

  const trackFormValidationError = useCallback((fieldName: string, errorMessage: string) => {
    trackEvent('form_validation_error', {
      form_field: fieldName,
      error_message: errorMessage,
      error_type: 'validation'
    });
  }, [trackEvent]);

  // UI interaction tracking
  const trackButtonClick = useCallback((buttonId: string, buttonText: string) => {
    trackEvent('button_clicked', {
      element_id: buttonId,
      element_text: buttonText,
      interaction_type: 'click'
    });
  }, [trackEvent]);

  const trackElementHover = useCallback((elementId: string, elementType: string) => {
    trackEvent('element_hovered', {
      element_id: elementId,
      element_type: elementType,
      interaction_type: 'hover'
    });
  }, [trackEvent]);

  // Payment specific tracking
  const trackPaymentTypeSelection = useCallback((paymentType: string, amount: number) => {
    trackEvent('payment_type_selected', {
      payment_type: paymentType,
      amount: amount,
      time_to_selection: Date.now() - pageLoadTime.current
    });
  }, [trackEvent]);

  const trackCheckboxInteraction = useCallback((checkboxId: string, checked: boolean) => {
    trackEvent('checkbox_interaction', {
      element_id: checkboxId,
      interaction_type: checked ? 'checked' : 'unchecked'
    });
  }, [trackEvent]);

  // PIX modal specific tracking
  const trackPixModalOpen = useCallback((amount: number) => {
    trackEvent('pix_modal_opened', {
      payment_method: 'pix',
      amount: amount
    });
  }, [trackEvent]);

  const trackPixCodeCopy = useCallback(() => {
    trackEvent('pix_code_copied', {
      payment_method: 'pix',
      interaction_type: 'copy'
    });
  }, [trackEvent]);

  const trackPixPaymentConfirmed = useCallback(() => {
    trackEvent('pix_payment_confirmed', {
      payment_method: 'pix',
      interaction_type: 'confirm'
    });
  }, [trackEvent]);

  const trackPixModalClose = useCallback((reason: 'confirmed' | 'cancelled' | 'abandoned') => {
    trackEvent('pix_modal_closed', {
      payment_method: 'pix',
      close_reason: reason
    });
  }, [trackEvent]);

  // Abandonment tracking
  const trackFormAbandonment = useCallback((abandonmentPoint: string, formData: any) => {
    const completedFields = Object.values(formData).filter(value => value).length;
    trackEvent('form_abandoned', {
      abandonment_point: abandonmentPoint,
      completed_fields: completedFields,
      total_fields: Object.keys(formData).length,
      time_before_abandon: Date.now() - pageLoadTime.current
    });
  }, [trackEvent]);

  // Update user info for tracking
  const updateUserInfo = useCallback((name: string, email: string) => {
    setUserInfo({ name, email });
  }, []);

  return {
    trackEvent,
    trackFormFieldFocus,
    trackFormFieldBlur,
    trackFormCompletion, // Nova função para tracking de formulário completo
    trackFormValidationError,
    trackButtonClick,
    trackElementHover,
    trackPaymentTypeSelection,
    trackCheckboxInteraction,
    trackPixModalOpen,
    trackPixCodeCopy,
    trackPixPaymentConfirmed,
    trackPixModalClose,
    trackFormAbandonment,
    updateUserInfo,
    sessionId: sessionId.current
  };
};