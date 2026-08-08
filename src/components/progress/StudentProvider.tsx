"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ClassId } from "@/lib/curriculum";

/**
 * The signed-in student, handed down from the server.
 *
 * This replaced a provider that read localStorage on mount, and the difference
 * is not where the bytes live. The old one could not know anything until after
 * the first paint, so every gated thing on the page had to render an "assume
 * unlocked" state and then correct itself, which is tolerable for a progress
 * bar and not tolerable for a lock worth a hundred points.
 *
 * Here the record arrives already resolved, as props, from a server component
 * that read the session cookie. There is no `ready` flag because there is no
 * moment at which the answer is unknown, and there is no setter because nothing
 * in the browser is allowed to change a balance, the server actions do that
 * and the page revalidates.
 */

export interface StudentSummary {
  signedIn: boolean;
  name: string | null;
  email: string | null;
  points: number;
  currentClass: ClassId;
  passedCount: number;
  unlockedCount: number;
  totalCount: number;
  /** Classes whose promotion screen has already been shown. */
  promotionsSeen: string[];
}

export const SIGNED_OUT: StudentSummary = {
  signedIn: false,
  name: null,
  email: null,
  points: 0,
  currentClass: "D",
  passedCount: 0,
  unlockedCount: 1,
  totalCount: 0,
  promotionsSeen: [],
};

const StudentContext = createContext<StudentSummary>(SIGNED_OUT);

export function StudentProvider({
  student,
  children,
}: {
  student: StudentSummary;
  children: ReactNode;
}) {
  return <StudentContext.Provider value={student}>{children}</StudentContext.Provider>;
}

export function useStudent(): StudentSummary {
  return useContext(StudentContext);
}
