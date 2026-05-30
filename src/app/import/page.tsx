import { ImportForm } from "@/components/ImportForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ImportPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Back button */}
      <div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            返回广场
          </Button>
        </Link>
      </div>

      {/* Import form */}
      <ImportForm />
    </div>
  );
}
