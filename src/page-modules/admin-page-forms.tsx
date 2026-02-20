import {
  FormInput,
  FormLabel,
  FormSelect,
  FormTextarea,
} from "@/components/ui/form-controls";
import type { ChangeEvent } from "react";
import { UiDiv } from "@/components/ui/html-elements";
import { VisibilityToggle } from "@/components/ui/visibility-toggle";

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

type AdminUserFormValues = {
  email: string;
  password: string;
  username: string;
  description: string;
  locale: "en" | "de";
};

type AdminCampaignFormValues = {
  ownerUserId: string;
  title: string;
  description: string;
  isPrivate: boolean;
};

type AdminCharacterFormValues = {
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

const UserFormFields = ({
  t,
  values,
  passwordPlaceholder,
  onChange,
}: UserFormFieldsProps) => {
  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...values, email: event.target.value });
  };
  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...values, password: event.target.value });
  };
  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...values, username: event.target.value });
  };
  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...values, description: event.target.value });
  };
  const handleLocaleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...values, locale: event.target.value as "en" | "de" });
  };

  return (
    <UiDiv gridGap={2}>
      <FormInput
        placeholder={t("ui.fields.email")}
        value={values.email}
        onChange={handleEmailChange}
      />
      <FormInput
        placeholder={passwordPlaceholder}
        value={values.password}
        onChange={handlePasswordChange}
      />
      <FormInput
        placeholder={t("ui.fields.username")}
        value={values.username}
        onChange={handleUsernameChange}
      />
      <FormTextarea
        size="md"
        placeholder={t("ui.fields.description")}
        value={values.description}
        onChange={handleDescriptionChange}
      />
      <FormSelect value={values.locale} onChange={handleLocaleChange}>
        <option value="en">en</option>
        <option value="de">de</option>
      </FormSelect>
    </UiDiv>
  );
};

type CampaignFormFieldsProps = {
  t: Translator;
  values: AdminCampaignFormValues;
  users: UserOption[];
  onChange: (next: AdminCampaignFormValues) => void;
};

const CampaignFormFields = ({
  t,
  values,
  users,
  onChange,
}: CampaignFormFieldsProps) => {
  const handleOwnerUserIdChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...values, ownerUserId: event.target.value });
  };
  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...values, title: event.target.value });
  };
  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...values, description: event.target.value });
  };
  const handleIsPrivateToggle = () => {
    onChange({ ...values, isPrivate: !values.isPrivate });
  };

  return (
    <UiDiv gridGap={2}>
      <FormLabel>{t("ui.admin.ownerLabel")}</FormLabel>
      <FormSelect value={values.ownerUserId} onChange={handleOwnerUserIdChange}>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.username} ({user.email})
          </option>
        ))}
      </FormSelect>
      <FormInput
        placeholder={t("ui.fields.campaignTitle")}
        value={values.title}
        onChange={handleTitleChange}
      />
      <FormTextarea
        size="md"
        placeholder={t("ui.fields.campaignDescription")}
        value={values.description}
        onChange={handleDescriptionChange}
      />
      <VisibilityToggle
        isPrivate={values.isPrivate}
        label={t("ui.fields.visibilityPrivate")}
        onLabel={t("ui.actions.on")}
        offLabel={t("ui.actions.off")}
        onToggle={handleIsPrivateToggle}
      />
    </UiDiv>
  );
};

type CharacterFormFieldsProps = {
  t: Translator;
  values: AdminCharacterFormValues;
  users: UserOption[];
  campaigns: CampaignOption[];
  onChange: (next: AdminCharacterFormValues) => void;
};

const CharacterFormFields = ({
  t,
  values,
  users,
  campaigns,
  onChange,
}: CharacterFormFieldsProps) => {
  const handleOwnerUserIdChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...values, ownerUserId: event.target.value });
  };
  const handleCampaignIdTextChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    onChange({ ...values, campaignIdText: event.target.value });
  };
  const handleTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...values, type: event.target.value as "player" | "npc" });
  };
  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...values, name: event.target.value });
  };
  const handleAgeTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...values, ageText: event.target.value });
  };
  const handleAvatarPathTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...values, avatarPathText: event.target.value });
  };
  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...values, description: event.target.value });
  };
  const handleIsPrivateToggle = () => {
    onChange({ ...values, isPrivate: !values.isPrivate });
  };

  return (
    <UiDiv gridGap={2}>
      <FormLabel>{t("ui.admin.ownerLabel")}</FormLabel>
      <FormSelect value={values.ownerUserId} onChange={handleOwnerUserIdChange}>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.username} ({user.email})
          </option>
        ))}
      </FormSelect>

      <FormLabel>{t("ui.admin.campaignLabel")}</FormLabel>
      <FormSelect
        value={values.campaignIdText}
        onChange={handleCampaignIdTextChange}
      >
        <option value="">{t("ui.admin.noCampaign")}</option>
        {campaigns.map((campaign) => (
          <option key={campaign.id} value={campaign.id}>
            {campaign.title}
          </option>
        ))}
      </FormSelect>

      <FormSelect value={values.type} onChange={handleTypeChange}>
        <option value="player">{t("ui.labels.characterType.player")}</option>
        <option value="npc">{t("ui.labels.characterType.npc")}</option>
      </FormSelect>

      <FormInput
        placeholder={t("ui.fields.characterName")}
        value={values.name}
        onChange={handleNameChange}
      />
      <FormInput
        placeholder={t("ui.fields.characterAge")}
        value={values.ageText}
        onChange={handleAgeTextChange}
      />
      <FormInput
        placeholder={t("ui.characterEdit.avatarPath")}
        value={values.avatarPathText}
        onChange={handleAvatarPathTextChange}
      />
      <FormTextarea
        size="md"
        placeholder={t("ui.fields.description")}
        value={values.description}
        onChange={handleDescriptionChange}
      />
      <VisibilityToggle
        isPrivate={values.isPrivate}
        label={t("ui.fields.visibilityPrivate")}
        onLabel={t("ui.actions.on")}
        offLabel={t("ui.actions.off")}
        onToggle={handleIsPrivateToggle}
      />
    </UiDiv>
  );
};

export type {
  AdminCampaignFormValues,
  AdminCharacterFormValues,
  AdminUserFormValues,
};
export { CampaignFormFields, CharacterFormFields, UserFormFields };
