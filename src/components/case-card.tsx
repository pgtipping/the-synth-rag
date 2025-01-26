"use client";

import { Icons } from "@/components/icons";
import { motion } from "framer-motion";
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
      <motion.div
        whileHover={{
          scale: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 1
            : 1.02,
          boxShadow: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "none"
            : "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        }}
        transition={{ type: "tween", duration: 0.2 }}
      >
        <Card className="cursor-pointer">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <Icon className="h-6 w-6 text-primary" />
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    </Link>
  );
}
