"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Entity = {
  key: string;
  title: string;
  path: string;
};

interface Role {
  type: string;
  action: string;
  scope: string;
}

export function EntityCard({ entity }: { entity: Entity; roles: Role[] }) {
  const canView = true;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{entity.title}</CardTitle>
      </CardHeader>
      <CardFooter className="flex gap-2">
        {canView && (
          <Button asChild variant="outline" size="sm">
            <Link href={entity.path}>Открыть</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
