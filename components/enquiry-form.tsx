"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Select } from "./ui/select";
import ReCAPTCHA from "react-google-recaptcha";
import { submitEnquiry } from "@/lib/api";

const GRADES = [
  "Early Years (Nursery-Prep)",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
];

type Fields = {
  student: string;
  grade: string;
  dob: string;
  gender: string;
  parent: string;
  phone: string;
  email: string;
  comment: string;
};

type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY_FIELDS: Fields = {
  student: "",
  grade: "",
  dob: "",
  gender: "",
  parent: "",
  phone: "",
  email: "",
  comment: "",
};

type Option = { value: string; label: string };

const GRADE_OPTIONS: Option[] = GRADES.map((g) => ({ value: g, label: g }));
const GENDER_OPTIONS: Option[] = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const inputBase =
  "w-full rounded-xl border bg-bg/60 px-3.5 py-2 text-sm text-fg placeholder:text-muted/60 transition-all duration-200 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-clay/40";

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.student.trim().length < 2) e.student = "Please enter the student's name.";
  if (!f.grade) e.grade = "Select the grade.";
  if (!f.dob) e.dob = "Enter the date of birth.";
  if (!f.gender) e.gender = "Select a gender.";
  if (f.parent.trim().length < 2) e.parent = "Please enter the parent's name.";
  if (!/^\d{10}$/.test(f.phone.replace(/\D/g, ""))) e.phone = "Enter a valid 10-digit phone number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Enter a valid email address.";
  if (f.comment.trim().length < 2) e.comment = "Please leave a comment.";
  return e;
}

export default function EnquiryForm() {
  const [f, setF] = useState<Fields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const setField = (k: keyof Fields, value: string) => {
    setF((p) => ({ ...p, [k]: value }));
    setErrors((p) => (p[k] ? { ...p, [k]: undefined } : p));
  };

  const onInputChange =
    (k: keyof Fields) =>
    (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setField(k, ev.target.value);

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate(f);
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    if (!recaptchaToken) {
      toast.error("Please complete the reCAPTCHA to submit the form.");
      return;
    }

    setSubmitting(true);
    try {
      await submitEnquiry({
        submit_date: new Date().toLocaleString(),
        student_name: f.student,
        grade: f.grade,
        dob: f.dob,
        gender: f.gender,
        parent_name: f.parent,
        mobile_no: f.phone,
        email: f.email,
        comment: f.comment,
      });

      toast.success("Thank you! Your inquiry has been submitted.");
      setF(EMPTY_FIELDS);
    } catch (error) {
      console.error("Form submission failed:", error);
      toast.error("Something went wrong. Please try submitting again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (k: keyof Fields) =>
    `${inputBase} ${
      errors[k] ? "border-clay ring-2 ring-clay/30" : "border-fg/25 hover:border-fg/40"
    }`;

  return (
    <div className="relative w-full">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-fg/5 sm:p-6"
      >
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Field label="Student Name *" id="student" error={errors.student}>
              <input
                id="student"
                type="text"
                value={f.student}
                onChange={onInputChange("student")}
                placeholder="Child's full name"
                className={fieldClass("student")}
                aria-invalid={!!errors.student}
              />
            </Field>

            <Field label="Select Grade *" id="grade" error={errors.grade}>
              <Select
                instanceId="grade-select"
                options={GRADE_OPTIONS}
                placeholder="Select Grade"
                value={f.grade ? { value: f.grade, label: f.grade } : null}
                onChange={(opt) => setField("grade", (opt as Option | null)?.value ?? "")}
                error={errors.grade}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Field label="Date of Birth *" id="dob" error={errors.dob}>
              <input
                id="dob"
                type="date"
                value={f.dob}
                onChange={onInputChange("dob")}
                className={fieldClass("dob")}
                aria-invalid={!!errors.dob}
              />
            </Field>

            <Field label="Gender *" id="gender" error={errors.gender}>
              <Select
                instanceId="gender-select"
                options={GENDER_OPTIONS}
                placeholder="Select Gender"
                value={f.gender ? { value: f.gender, label: f.gender } : null}
                onChange={(opt) => setField("gender", (opt as Option | null)?.value ?? "")}
                error={errors.gender}
              />
            </Field>
          </div>

          <Field label="Parents Name *" id="parent" error={errors.parent}>
            <input
              id="parent"
              type="text"
              autoComplete="name"
              value={f.parent}
              onChange={onInputChange("parent")}
              placeholder="Full Name"
              className={fieldClass("parent")}
              aria-invalid={!!errors.parent}
            />
          </Field>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Field label="Mobile *" id="phone" error={errors.phone}>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={f.phone}
                onChange={onInputChange("phone")}
                placeholder="10-digit number"
                className={fieldClass("phone")}
                aria-invalid={!!errors.phone}
              />
            </Field>

            <Field label="Email *" id="email" error={errors.email}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={f.email}
                onChange={onInputChange("email")}
                placeholder="Email Address"
                className={fieldClass("email")}
                aria-invalid={!!errors.email}
              />
            </Field>
          </div>

          <Field label="Comment *" id="comment" error={errors.comment}>
            <textarea
              id="comment"
              value={f.comment}
              onChange={onInputChange("comment")}
              placeholder="Any additional information..."
              rows={2}
              className={`${fieldClass("comment")} resize-none`}
              aria-invalid={!!errors.comment}
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-center w-full overflow-hidden">
          <ReCAPTCHA
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "YOUR_SITE_KEY_HERE"}
            onChange={(token) => setRecaptchaToken(token)}
            onExpired={() => setRecaptchaToken(null)}
          />
        </div>

        <motion.button
          type="submit"
          disabled={submitting}
          whileTap={!submitting ? { scale: 0.98 } : {}}
          className={`mt-4 w-full rounded-full bg-clay px-6 py-2.5 text-sm font-semibold text-ivory shadow-soft transition-colors duration-200 ${
            submitting ? "opacity-70 cursor-not-allowed" : "hover:bg-clay-deep"
          }`}
        >
          {submitting ? "Sending..." : "Request a callback"}
        </motion.button>
      </form>
    </div>
  );
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[0.75rem] font-semibold text-fg">
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-[0.7rem] font-medium text-clay-deep"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
