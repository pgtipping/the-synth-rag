"use client";

import { Icons } from "@/src/components/icons";
import { motion } from "framer-motion";
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
    <Link href={href} className="block">
      <motion.div
        whileHover={{
          y: -2,
          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        }}
        className="h-full"
      >
        <div className="h-full bg-light-background dark:bg-dark-secondary shadow-card-light dark:shadow-card-dark rounded-card">
          <div className="p-4 sm:p-[30px]">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 flex items-center justify-center">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-light-accent dark:text-dark-accent" />
              </div>
              <h3 className="text-base sm:text-body-large font-semibold text-light-text-primary dark:text-dark-text-primary">
                {title}
              </h3>
            </div>
            <p className="text-sm sm:text-[17px] text-light-text-secondary dark:text-dark-text-secondary">
              {description}
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
