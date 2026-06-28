"use client";

import { Building2, Globe, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CompanyProfile } from "@/types/agent";
import { Z_UNKNOWN } from "zlib";

interface OverviewCardProps {
  profile: CompanyProfile;
}

export function OverviewCard({ profile }: OverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          {profile.image ? (
            <img
              src={profile.image}
              alt={profile.companyName}
              className="h-14 w-14 rounded-lg border border-zinc-200 object-contain p-1 dark:border-zinc-700"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Building2 className="h-7 w-7 text-emerald-600" />
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-xl">{profile.companyName}</CardTitle>
            <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{profile.symbol}</Badge>
              <Badge variant="secondary">{profile.exchange}</Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {profile.description.length > 180
            ? profile.description.substring(0, 180) + "..."
            : profile.description}
        </p>
        <div className="grid grid-cols-1 gap-3 mt-5">

          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">Sector</span>
            <span className="font-medium">{profile.sector}</span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">Industry</span>
            <span className="font-medium">{profile.industry}</span>
          </div>

          {profile.ceo !== "Unknown" && (
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-500">CEO</span>
              <span className="font-medium">{profile.ceo}</span>
            </div>
          )}

          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">Employees</span>
            <span className="font-medium">
              {profile.employees.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">Country</span>
            <span className="font-medium">{profile.country}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">Website</span>

            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-500 hover:underline"
            >
              {profile.website
                ?.replace("https://", "")
                ?.replace("http://", "")
                ?.replace("/", "") || "Not Available"}
            </a>
          </div>

          {profile.ipoDate != "Unknown" && (

            <div className="flex justify-between">
              <span className="text-zinc-500">IPO</span>
              <span className="font-medium">
                {profile.ipoDate || "Unknown"}
              </span>
            </div>

          )}

        </div>
      </CardContent>
    </Card >
  );
}
