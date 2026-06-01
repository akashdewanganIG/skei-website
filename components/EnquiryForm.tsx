"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const GRADES = [
  "Nursery",
  "LKG",
  "UKG",
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
  "Grade 11",
  "Grade 12",
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

const EASE = [0.2, 0, 0, 1] as const;

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.student.trim().length < 2) e.student = "Please enter the student's name.";
  if (!f.grade) e.grade = "Select the grade.";
  if (!f.dob) e.dob = "Enter the date of birth.";
  if (!f.gender) e.gender = "Select a gender.";
  if (f.parent.trim().length < 2) e.parent = "Please enter the parent's name.";
  if (!/^\d{10}$/.test(f.phone.replace(/\D/g, "")))
    e.phone = "Enter a valid 10-digit phone number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
    e.email = "Enter a valid email address.";
  if (f.comment.trim().length < 2) e.comment = "Please leave a comment.";
  return e;
}

const inputBase =
  "w-full rounded-xl border bg-ivory/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-all duration-200 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-clay/40";

export default function EnquiryForm() {
  const [f, setF] = useState<Fields>({
    student: "",
    grade: "",
    dob: "",
    gender: "",
    parent: "",
    phone: "",
    email: "",
    comment: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);

  const set = (k: keyof Fields) => (
    ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setF((p) => ({ ...p, [k]: ev.target.value }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate(f);
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(f).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) throw new Error("Google Script URL is not defined.");

      await fetch(scriptUrl, {
        method: "POST",
        body: formData,
        mode: "no-cors",
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error("Form submission failed:", error);
      alert("Something went wrong. Please try submitting again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (k: keyof Fields) =>
    `${inputBase} ${
      errors[k] ? "border-clay ring-2 ring-clay/30" : "border-ink/25 hover:border-ink/40"
    }`;

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex flex-col items-center justify-center rounded-3xl bg-white px-7 py-14 text-center shadow-card ring-1 ring-ink/5"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.12, type: "spring", stiffness: 240, damping: 16 }}
              className="grid h-16 w-16 place-items-center rounded-full bg-forest text-ivory"
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 12.5l4.2 4.2L19 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
            <h3 className="mt-6 font-display text-2xl text-ink">
              Thank you{f.parent ? `, ${f.parent.split(" ")[0]}` : ""}!
            </h3>
            <p className="mt-2 max-w-xs text-[0.95rem] leading-relaxed text-muted">
              Your inquiry for{" "}
              <span className="font-medium text-ink">{f.student || "your child"}</span> has
              reached our admissions team. We&apos;ll reach out within 24 hours to plan your
              campus visit.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setF({ student: "", grade: "", dob: "", gender: "", parent: "", phone: "", email: "", comment: "" });
              }}
              className="mt-7 text-sm font-semibold text-clay underline underline-offset-4 transition-colors hover:text-clay-deep"
            >
              Submit another inquiry
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            noValidate
            onSubmit={onSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="w-full rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink/5 sm:p-7"
          >
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Student Name *" id="student" error={errors.student}>
                  <input
                    id="student"
                    type="text"
                    value={f.student}
                    onChange={set("student")}
                    placeholder="Child's full name"
                    className={fieldClass("student")}
                    aria-invalid={!!errors.student}
                  />
                </Field>

                <Field label="Select Grade *" id="grade" error={errors.grade}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setGradeOpen(!gradeOpen)}
                      className={`${fieldClass("grade")} flex w-full items-center justify-between text-left ${
                        f.grade ? "text-ink" : "text-muted/60"
                      }`}
                      aria-invalid={!!errors.grade}
                    >
                      {f.grade || "Select Grade"}
                      <svg
                        className={`h-4 w-4 text-muted transition-transform duration-200 ${
                          gradeOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {gradeOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setGradeOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 top-[calc(100%+8px)] z-50 max-h-[240px] w-full overflow-y-auto rounded-[16px] border border-ink/15 bg-surface p-1 shadow-lift backdrop-blur-md"
                          >
                            {GRADES.map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => {
                                  setF((p) => ({ ...p, grade: g }));
                                  if (errors.grade) setErrors((p) => ({ ...p, grade: undefined }));
                                  setGradeOpen(false);
                                }}
                                className={`w-full rounded-lg px-3 py-1.5 text-left text-[0.85rem] transition-colors ${
                                  f.grade === g
                                    ? "bg-clay/10 font-bold text-clay"
                                    : "font-medium text-ink hover:bg-ivory-2"
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Date of Birth *" id="dob" error={errors.dob}>
                  <input
                    id="dob"
                    type="date"
                    value={f.dob}
                    onChange={set("dob")}
                    className={fieldClass("dob")}
                    aria-invalid={!!errors.dob}
                  />
                </Field>

                <Field label="Gender *" id="gender" error={errors.gender}>
                  <select
                    id="gender"
                    value={f.gender}
                    onChange={set("gender")}
                    className={`${fieldClass("gender")} appearance-none`}
                    aria-invalid={!!errors.gender}
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </Field>
              </div>

              <Field label="Parents Name *" id="parent" error={errors.parent}>
                <input
                  id="parent"
                  type="text"
                  autoComplete="name"
                  value={f.parent}
                  onChange={set("parent")}
                  placeholder="Full Name"
                  className={fieldClass("parent")}
                  aria-invalid={!!errors.parent}
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Mobile *" id="phone" error={errors.phone}>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={f.phone}
                    onChange={set("phone")}
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
                    onChange={set("email")}
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
                  onChange={set("comment")}
                  placeholder="Any additional information..."
                  rows={2}
                  className={`${fieldClass("comment")} resize-none`}
                  aria-invalid={!!errors.comment}
                />
              </Field>
            </div>

            <motion.button
              type="submit"
              disabled={submitting}
              whileTap={!submitting ? { scale: 0.98 } : {}}
              className={`mt-5 w-full rounded-full bg-clay px-6 py-3 text-sm font-semibold text-ivory shadow-soft transition-colors duration-200 ${
                submitting ? "opacity-70 cursor-not-allowed" : "hover:bg-clay-deep"
              }`}
            >
              {submitting ? "Sending..." : "Request a callback"}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
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
      <label htmlFor={id} className="text-[0.75rem] font-semibold text-ink">
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
