"use client";

import { Icons } from "@/components/icons";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import Link from "next/link";

interface CaseCardProps {
  title: string;
  description: string;
  icon: keyof typeof Icons;
  href: string;
}

export function CaseCard({ title, description, icon, href }: CaseCardProps) {
  const Icon = Icons[icon];

  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <Icon className="h-6 w-6 text-primary" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
