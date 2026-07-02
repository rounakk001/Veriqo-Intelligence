"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/types/agent";
import { CommitteeModal } from "./CommitteeModal";
import { useAuthGate } from "@/lib/context/AuthGateContext";

interface CommitteeCardProps {
  result: AnalysisResult;
}

export function CommitteeCard({ result }: CommitteeCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { requireAuth } = useAuthGate();

  function handleOpen() {
    const allowed = requireAuth({ type: "committee" });
    if (allowed) setIsOpen(true);
  }

  return (
    <>
      <Card className="border-2 mt-6">
        <CardHeader>
          <CardDescription>Advanced Analysis</CardDescription>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            AI Investment Committee
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-500 mb-6 text-sm">
            Three independent AI analysts (Bull, Bear, and Moderator) evaluate the investment from all angles before reaching a balanced, definitive conclusion.
          </p>
          <Button onClick={handleOpen} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
            Open Committee
          </Button>
        </CardContent>
      </Card>
      
      {isOpen && (
        <CommitteeModal 
          result={result} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
