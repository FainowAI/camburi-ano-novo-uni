import AdminHeader from "@/components/AdminHeader";
import MFASetup from "@/components/MFASetup";

const MFASetupPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <MFASetup />
      </div>
    </div>
  );
};

export default MFASetupPage;