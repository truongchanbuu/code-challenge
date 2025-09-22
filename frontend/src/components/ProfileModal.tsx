import { useEffect, useMemo, useRef, useState } from "react";
import { X, Loader2, User2, Mail, Phone, Shield, Edit2 } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { EmailSchema } from "@/schemas/email.schema";
import { toast } from "sonner";
import Avatar from "./Avatar";
import OtpModal from "./OtpModal";
import { PhoneSchema } from "@/schemas/phone.schema";
import type { Channel } from "@/schemas/otp.schema";

const isEmailValid = (email?: string) => EmailSchema.safeParse(email).success;
const isPhoneValid = (phone?: string) => PhoneSchema.safeParse(phone).success;

type ProfileModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState<string | undefined>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [touched, setTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    currentUser,
    isProfileLoading,
    isProfileUpdating,
    updateMuatationAsync,
  } = useProfile({
    onCloseProfile: onClose,
  });

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpChannel, setOtpChannel] = useState<Channel>("email");
  const [otpValue, setOtpValue] = useState("");
  const otpPromiseRef = useRef<{
    resolve: () => void;
    reject: (e?: any) => void;
  } | null>(null);

  useEffect(() => {
    if (open && currentUser) {
      setUsername(currentUser.username || "");
      setEmail(currentUser.email || "");
      setPhoneNumber(currentUser.phoneNumber || "");
      setTouched(false);
      setErrorMsg(null);
      setIsEditing(false);
    }
  }, [open, currentUser]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditing) {
          handleCancel();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isEditing, onClose]);

  const changedEmail = useMemo(
    () => (email?.trim() || "") !== (currentUser?.email || ""),
    [email, currentUser?.email],
  );
  const changedPhone = useMemo(
    () => phoneNumber.trim() !== (currentUser?.phoneNumber || ""),
    [phoneNumber, currentUser?.phoneNumber],
  );
  const changedUsername = useMemo(
    () => username.trim() !== (currentUser?.username || ""),
    [username, currentUser?.username],
  );

  const canSubmit =
    !isProfileUpdating &&
    !isProfileLoading &&
    username.trim().length >= 2 &&
    isEmailValid(email) &&
    isPhoneValid(phoneNumber) &&
    (changedUsername || changedEmail || changedPhone);

  const handleEdit = () => {
    setIsEditing(true);
    setTouched(false);
    setErrorMsg(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTouched(false);
    setErrorMsg(null);
    setUsername(currentUser?.username || "");
    setEmail(currentUser?.email || "");
    setPhoneNumber(currentUser?.phoneNumber || "");
  };

  const runOtp = (channel: Channel, value: string) =>
    new Promise<void>((resolve, reject) => {
      otpPromiseRef.current = { resolve, reject };
      setOtpChannel(channel);
      setOtpValue(value);
      setOtpOpen(true);
    });

  const handleOtpVerified = async () => {
    otpPromiseRef.current?.resolve();
    otpPromiseRef.current = null;
  };

  const handleOtpClosed = () => {
    otpPromiseRef.current?.reject(new Error("OTP cancelled"));
    otpPromiseRef.current = null;
    setOtpOpen(false);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setTouched(true);
    setErrorMsg(null);

    if (!canSubmit) {
      toast.info("Invalid form values.");
      return;
    }

    const payload = {
      username: username.trim(),
      email: email?.trim() || undefined,
      phoneNumber: phoneNumber.trim(),
    };

    if (!changedEmail && !changedPhone) {
      try {
        await updateMuatationAsync(payload);
        toast.success("Profile updated.");
        setIsEditing(false);
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to update profile.");
      }
      return;
    }

    try {
      if (changedEmail && email) {
        await runOtp("email", email);
        setOtpOpen(false);
      }
      if (changedPhone && phoneNumber) {
        await runOtp("sms", phoneNumber);
        setOtpOpen(false);
      }

      await updateMuatationAsync(payload);
      toast.success("Update successfully!");
      setIsEditing(false);
    } catch (e: any) {
      if (e?.message === "OTP cancelled") {
        toast.message("OTP Cancelled.");
      } else {
        toast.error(e?.message || "Failed to verify OTP.");
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-in fade-in absolute inset-0 bg-black/20 backdrop-blur-md duration-200"
        onClick={isEditing ? handleCancel : onClose}
      />

      <div className="animate-in zoom-in-95 relative w-full max-w-md rounded-3xl border border-white/20 bg-white/95 shadow-2xl shadow-black/10 backdrop-blur-xl duration-300">
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && currentUser && !isProfileUpdating && (
              <button
                onClick={handleEdit}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-gray-100 transition-colors hover:bg-gray-200"
                aria-label="Edit profile"
              >
                <Edit2 className="h-4 w-4 text-gray-600" />
              </button>
            )}
            <button
              onClick={isEditing ? handleCancel : onClose}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-gray-100 transition-colors hover:bg-gray-200"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          {isProfileUpdating ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
              <p className="text-gray-600">Updating your profile...</p>
            </div>
          ) : currentUser ? (
            <>
              <div className="mb-8 text-center">
                <div className="relative mb-4 inline-block">
                  <Avatar name={currentUser.username} />
                  {!isEditing && (
                    <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
                <h3 className="mb-1 text-lg font-semibold text-gray-900">
                  {currentUser.username}
                </h3>
                <p className="text-sm text-gray-500">
                  {currentUser.email || "No email"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User2 className="h-4 w-4" />
                    Username
                  </label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!isEditing}
                    className={`w-full rounded-2xl border px-4 py-3 transition-all ${
                      isEditing
                        ? "border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        : "border-gray-100 bg-gray-50 text-gray-500"
                    } ${
                      isEditing && touched && username.trim().length < 2
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                        : ""
                    }`}
                    placeholder="Enter username"
                  />
                  {isEditing && touched && username.trim().length < 2 && (
                    <p className="mt-1 text-xs text-red-500">
                      Username must be at least 2 characters
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email ?? ""}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                    className={`w-full rounded-2xl border px-4 py-3 transition-all ${
                      isEditing
                        ? "border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        : "border-gray-100 bg-gray-50 text-gray-500"
                    } ${
                      isEditing && touched && !isEmailValid(email || undefined)
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                        : ""
                    }`}
                    placeholder="your@email.com"
                  />
                  {isEditing &&
                    touched &&
                    !isEmailValid(email || undefined) && (
                      <p className="mt-1 text-xs text-red-500">
                        Please enter a valid email
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4" />
                    Phone
                  </label>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled
                    className={`w-full rounded-2xl border px-4 py-3 transition-all ${
                      isEditing
                        ? "border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        : "border-gray-100 bg-gray-50 text-gray-500"
                    } ${
                      isEditing && touched && !isPhoneValid(phoneNumber)
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                        : ""
                    }`}
                    placeholder="+84xxxxxxxxx hoặc 0xxxxxxxxx"
                  />
                  {isEditing && touched && !isPhoneValid(phoneNumber) && (
                    <p className="mt-1 text-xs text-red-500">
                      Please enter a valid phone number
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Shield className="h-4 w-4" />
                    Role
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      value={currentUser.role || "User"}
                      disabled
                      className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-gray-500"
                    />
                    <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      {currentUser.role || "User"}
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-700">{errorMsg}</p>
                  </div>
                )}

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 cursor-pointer rounded-2xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="bg-primary flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3 font-medium text-white transition-all hover:from-blue-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProfileLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving
                        </>
                      ) : (
                        <span>Save</span>
                      )}
                    </button>
                  </div>
                )}
              </form>

              {isEditing && (changedEmail || changedPhone) && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  You need to verify OTP to change
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-100">
                <User2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No Profile Data
              </h3>
              <p className="text-gray-500">
                Unable to load profile information
              </p>
            </div>
          )}
        </div>
      </div>

      {/* OTP Modal */}
      <OtpModal
        open={otpOpen}
        onClose={handleOtpClosed}
        channel={otpChannel}
        value={otpValue}
        onVerified={handleOtpVerified}
      />
    </div>
  );
}
