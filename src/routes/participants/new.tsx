import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/page-wrapper";
import {
  ParticipantForm,
  type ParticipantFormData,
} from "@/components/participants/participant-form";
import { useCreateParticipant } from "@/hooks/use-participants";
import { toast } from "sonner";

export const Route = createFileRoute("/participants/new")({
  component: NewParticipantPage,
});

function NewParticipantPage() {
  const navigate = useNavigate();
  const create = useCreateParticipant();

  const handleSubmit = async (data: ParticipantFormData) => {
    try {
      const p = await create.mutateAsync({
        name: data.name,
        email: data.email || null,
        age: data.age ? parseInt(data.age) : null,
        gender: data.gender || null,
        occupation: data.occupation || null,
        tech_proficiency:
          (data.tech_proficiency as "low" | "medium" | "high") || null,
        notes: data.notes || null,
      });
      toast.success("Participant created");
      navigate({
        to: "/participants/$participantId",
        params: { participantId: p.id },
      });
    } catch {
      toast.error("Failed to create participant");
    }
  };

  return (
    <PageWrapper title="New Participant">
      <ParticipantForm onSubmit={handleSubmit} submitLabel="Create Participant" />
    </PageWrapper>
  );
}
