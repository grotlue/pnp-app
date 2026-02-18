import type { CampaignFormValues } from "../types";
import { FormInput, FormTextarea } from "@/components/common/form-controls";
import { VisibilityToggle } from "@/components/common/visibility-toggle";
import { UiDiv } from "@/components/ui/html-elements";

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
    <UiDiv className="grid gap-2">
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
        className="min-h-24"
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
    </UiDiv>
  );
}
