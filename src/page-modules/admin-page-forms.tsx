import {
  FormInput,
  FormLabel,
  FormSelect,
  FormTextarea,
} from "@/components/common/form-controls";
import { VisibilityToggle } from "@/components/common/visibility-toggle";

type Translator = (key: string) => string;

type UserOption = {
  id: string;
  username: string;
  email: string;
};

type CampaignOption = {
  id: string;
  title: string;
};

export type AdminUserFormValues = {
  email: string;
  password: string;
  username: string;
  description: string;
  locale: "en" | "de";
};

export type AdminCampaignFormValues = {
  ownerUserId: string;
  title: string;
  description: string;
  isPrivate: boolean;
};

export type AdminCharacterFormValues = {
  ownerUserId: string;
  campaignIdText: string;
  type: "player" | "npc";
  name: string;
  ageText: string;
  description: string;
  avatarPathText: string;
  isPrivate: boolean;
};

type UserFormFieldsProps = {
  t: Translator;
  values: AdminUserFormValues;
  passwordPlaceholder: string;
  onChange: (next: AdminUserFormValues) => void;
};

export function UserFormFields({
  t,
  values,
  passwordPlaceholder,
  onChange,
}: UserFormFieldsProps) {
  return (
    <div className="grid gap-2">
      <FormInput
        placeholder={t("ui.fields.email")}
        value={values.email}
        onChange={(event) => onChange({ ...values, email: event.target.value })}
      />
      <FormInput
        placeholder={passwordPlaceholder}
        value={values.password}
        onChange={(event) =>
          onChange({ ...values, password: event.target.value })
        }
      />
      <FormInput
        placeholder={t("ui.fields.username")}
        value={values.username}
        onChange={(event) =>
          onChange({ ...values, username: event.target.value })
        }
      />
      <FormTextarea
        className="min-h-20"
        placeholder={t("ui.fields.description")}
        value={values.description}
        onChange={(event) =>
          onChange({ ...values, description: event.target.value })
        }
      />
      <FormSelect
        value={values.locale}
        onChange={(event) =>
          onChange({ ...values, locale: event.target.value as "en" | "de" })
        }
      >
        <option value="en">en</option>
        <option value="de">de</option>
      </FormSelect>
    </div>
  );
}

type CampaignFormFieldsProps = {
  t: Translator;
  values: AdminCampaignFormValues;
  users: UserOption[];
  onChange: (next: AdminCampaignFormValues) => void;
};

export function CampaignFormFields({
  t,
  values,
  users,
  onChange,
}: CampaignFormFieldsProps) {
  return (
    <div className="grid gap-2">
      <FormLabel>{t("ui.admin.ownerLabel")}</FormLabel>
      <FormSelect
        value={values.ownerUserId}
        onChange={(event) =>
          onChange({ ...values, ownerUserId: event.target.value })
        }
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.username} ({user.email})
          </option>
        ))}
      </FormSelect>
      <FormInput
        placeholder={t("ui.fields.campaignTitle")}
        value={values.title}
        onChange={(event) => onChange({ ...values, title: event.target.value })}
      />
      <FormTextarea
        className="min-h-20"
        placeholder={t("ui.fields.campaignDescription")}
        value={values.description}
        onChange={(event) =>
          onChange({ ...values, description: event.target.value })
        }
      />
      <VisibilityToggle
        isPrivate={values.isPrivate}
        label={t("ui.fields.visibilityPrivate")}
        onLabel={t("ui.actions.on")}
        offLabel={t("ui.actions.off")}
        onToggle={() => onChange({ ...values, isPrivate: !values.isPrivate })}
      />
    </div>
  );
}

type CharacterFormFieldsProps = {
  t: Translator;
  values: AdminCharacterFormValues;
  users: UserOption[];
  campaigns: CampaignOption[];
  onChange: (next: AdminCharacterFormValues) => void;
};

export function CharacterFormFields({
  t,
  values,
  users,
  campaigns,
  onChange,
}: CharacterFormFieldsProps) {
  return (
    <div className="grid gap-2">
      <FormLabel>{t("ui.admin.ownerLabel")}</FormLabel>
      <FormSelect
        value={values.ownerUserId}
        onChange={(event) =>
          onChange({ ...values, ownerUserId: event.target.value })
        }
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.username} ({user.email})
          </option>
        ))}
      </FormSelect>

      <FormLabel>{t("ui.admin.campaignLabel")}</FormLabel>
      <FormSelect
        value={values.campaignIdText}
        onChange={(event) =>
          onChange({ ...values, campaignIdText: event.target.value })
        }
      >
        <option value="">{t("ui.admin.noCampaign")}</option>
        {campaigns.map((campaign) => (
          <option key={campaign.id} value={campaign.id}>
            {campaign.title}
          </option>
        ))}
      </FormSelect>

      <FormSelect
        value={values.type}
        onChange={(event) =>
          onChange({ ...values, type: event.target.value as "player" | "npc" })
        }
      >
        <option value="player">{t("ui.labels.characterType.player")}</option>
        <option value="npc">{t("ui.labels.characterType.npc")}</option>
      </FormSelect>

      <FormInput
        placeholder={t("ui.fields.characterName")}
        value={values.name}
        onChange={(event) => onChange({ ...values, name: event.target.value })}
      />
      <FormInput
        placeholder={t("ui.fields.characterAge")}
        value={values.ageText}
        onChange={(event) =>
          onChange({ ...values, ageText: event.target.value })
        }
      />
      <FormInput
        placeholder={t("ui.characterEdit.avatarPath")}
        value={values.avatarPathText}
        onChange={(event) =>
          onChange({ ...values, avatarPathText: event.target.value })
        }
      />
      <FormTextarea
        className="min-h-20"
        placeholder={t("ui.fields.description")}
        value={values.description}
        onChange={(event) =>
          onChange({ ...values, description: event.target.value })
        }
      />
      <VisibilityToggle
        isPrivate={values.isPrivate}
        label={t("ui.fields.visibilityPrivate")}
        onLabel={t("ui.actions.on")}
        offLabel={t("ui.actions.off")}
        onToggle={() => onChange({ ...values, isPrivate: !values.isPrivate })}
      />
    </div>
  );
}
