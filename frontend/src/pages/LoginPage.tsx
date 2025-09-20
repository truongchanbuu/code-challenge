import EmailSignInForm from "@/features/auth/components/EmailSignIn";
import PasswordSignInForm from "@/features/auth/components/PasswordSignIn";
import SmsSignInForm from "@/features/auth/components/SmsSignIn";
import { storage } from "@/utils/storage";
import { Mail, LockKeyhole, Phone, ArrowLeft } from "lucide-react";
import { useState } from "react";

const TAB_CONFIG = [
  {
    key: "sms",
    label: "SMS",
    icon: Phone,
    description: "Sign in with phone number",
  },
  {
    key: "email",
    label: "Email",
    icon: Mail,
    description: "Get a OTP via email",
  },
  {
    key: "password",
    label: "Password",
    icon: LockKeyhole,
    description: "Traditional email & password",
  },
];

type TabType = (typeof TAB_CONFIG)[number]["key"];

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<TabType>("sms");

  const onBack = () => window.history.back();

  const renderTabContent = () => {
    switch (activeTab) {
      case "sms":
        return <SmsSignInForm />;
      case "email":
        return <EmailSignInForm />;
      case "password":
        return <PasswordSignInForm />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center">
      <div className="w-full max-w-xl">
        <header className="relative text-center">
          <div className="absolute left-0 mb-2">
            <button
              onClick={onBack}
              className="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content gap-2"
              aria-label="Go back"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Back
            </button>
          </div>

          <div>
            <div className="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
              <LockKeyhole className="text-primary h-8 w-8" />
            </div>
            <h1 className="text-base-content mb-2 text-3xl font-bold">
              Welcome back
            </h1>
            <p className="text-base-content/70">
              Choose your preferred sign-in method
            </p>
          </div>
        </header>

        <main className="card border-base-200/50 my-10 border shadow-xl">
          <div className="card-body">
            <div className="tabs tabs-boxed bg-base-200/50 mb-6" role="tablist">
              {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={activeTab === key}
                  aria-controls={`${key}-panel`}
                  className={`tab hover:text-primary-content flex-1 gap-2 font-medium transition-all duration-200 ${
                    activeTab === key
                      ? "tab-active bg-primary text-primary-content shadow-sm"
                      : "hover:bg-primary"
                  }`}
                  onClick={() => setActiveTab(key)}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{key.toUpperCase()}</span>
                </button>
              ))}
            </div>

            <div
              id={`${activeTab}-panel`}
              role="tabpanel"
              className="animate-in fade-in-0 duration-200"
            >
              {renderTabContent()}
            </div>
          </div>
        </main>

        <footer className="text-base-content/50 text-center text-sm">
          <p>
            <span className="text-base-content/70">
              Don&apos;t have an account?{" "}
            </span>
            <a href="#" className="link link-primary no-underline">
              Sign up
            </a>
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} Online Classroom Management System.
            All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
