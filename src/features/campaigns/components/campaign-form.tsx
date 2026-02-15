import type { CampaignFormValues } from "../types";

type CampaignFormProps = {
  values: CampaignFormValues;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  inputClassName: string;
  onChange: (next: CampaignFormValues) => void;
};

export function CampaignForm({
  values,
  titlePlaceholder,
  descriptionPlaceholder,
  inputClassName,
  onChange,
}: CampaignFormProps) {
  return (
    <div className="grid gap-2">
      <input
        className={inputClassName}
        placeholder={titlePlaceholder}
        value={values.title}
        onChange={(event) =>
          onChange({
            ...values,
            title: event.target.value,
          })
        }
      />
      <textarea
        className={`${inputClassName} min-h-24`}
        placeholder={descriptionPlaceholder}
        value={values.description}
        onChange={(event) =>
          onChange({
            ...values,
            description: event.target.value,
          })
        }
      />
    </div>
  );
}
