import type { CampaignFormValues } from "../types";
import { FormInput, FormTextarea } from "@/components/ui/form-controls";
import { VisibilityToggle } from "@/components/ui/visibility-toggle";
import { UiFormGrid } from "@/components/ui/html-elements";

type CampaignFormProps = {
  values: CampaignFormValues;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  visibilityLabel: string;
  onLabel: string;
  offLabel: string;
  onChange: (next: CampaignFormValues) => void;
};

export function CampaignForm({
  values,
  titlePlaceholder,
  descriptionPlaceholder,
  visibilityLabel,
  onLabel,
  offLabel,
  onChange,
}: CampaignFormProps) {
  return (
    <UiFormGrid>
      <FormInput
        placeholder={titlePlaceholder}
        value={values.title}
        onChange={(event) =>
          onChange({
            ...values,
            title: event.target.value,
          })
        }
      />
      <FormTextarea
        size="lg"
        placeholder={descriptionPlaceholder}
        value={values.description}
        onChange={(event) =>
          onChange({
            ...values,
            description: event.target.value,
          })
        }
      />
      <VisibilityToggle
        isPrivate={Boolean(values.isPrivate)}
        label={visibilityLabel}
        onLabel={onLabel}
        offLabel={offLabel}
        onToggle={() =>
          onChange({
            ...values,
            isPrivate: !Boolean(values.isPrivate),
          })
        }
      />
    </UiFormGrid>
  );
}
