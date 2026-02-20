import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/ui/form-controls";
import type { Campaign } from "@/features/campaigns/types";
import type {
  RelationshipCatalog,
  RelationshipDetail,
} from "@/features/relationships/types";
import { UiDiv, UiPre } from "@/components/ui/html-elements";

type Translator = (key: string) => string;

type RelationshipTargetMode = "existing" | "external";

type RelationshipAddFormValues = {
  targetCharacterId: string;
  targetSnapshotName: string;
  categoryId: string;
  labelPresetId: string;
  labelCustom: string;
  description: string;
  firstTimelineEntry: string;
};

type RelationshipEditFormValues = {
  targetCharacterId: string;
  targetSnapshotName: string;
  categoryId: string;
  labelPresetId: string;
  labelCustom: string;
  description: string;
};

type RelationshipTargetOption = {
  id: string;
  name: string;
};

type RelationshipBaseFormValues = {
  targetCharacterId: string;
  targetSnapshotName: string;
  categoryId: string;
  labelPresetId: string;
  labelCustom: string;
  description: string;
};

type RelationshipFormFieldsProps<TForm extends RelationshipBaseFormValues> = {
  t: Translator;
  mode: RelationshipTargetMode;
  onModeChange: (mode: RelationshipTargetMode) => void;
  targetOptions: RelationshipTargetOption[];
  catalog: RelationshipCatalog;
  form: TForm;
  onFormChange: Dispatch<SetStateAction<TForm>>;
  categoryValue: string;
  labelPresetValue: string;
};

const RelationshipFormFields = <TForm extends RelationshipBaseFormValues>({
  t,
  mode,
  onModeChange,
  targetOptions,
  catalog,
  form,
  onFormChange,
  categoryValue,
  labelPresetValue,
}: RelationshipFormFieldsProps<TForm>) => {
  const handleExistingMode = () => {
    onModeChange("existing");
  };

  const handleExternalMode = () => {
    onModeChange("external");
  };

  const handleTargetCharacterIdChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    onFormChange((prev) => ({
      ...prev,
      targetCharacterId: event.target.value,
    }));
  };

  const handleTargetSnapshotNameChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onFormChange((prev) => ({
      ...prev,
      targetSnapshotName: event.target.value,
    }));
  };

  const handleCategoryIdChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onFormChange((prev) => ({ ...prev, categoryId: event.target.value }));
  };

  const handleLabelPresetIdChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onFormChange((prev) => ({
      ...prev,
      labelPresetId: event.target.value,
      labelCustom: "",
    }));
  };

  const handleLabelCustomChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFormChange((prev) => ({
      ...prev,
      labelCustom: event.target.value,
      labelPresetId: "",
    }));
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onFormChange((prev) => ({ ...prev, description: event.target.value }));
  };

  return (
    <UiDiv gridGap={2}>
      <UiDiv inlineGap={2}>
        <Button
          size="sm"
          variant={mode === "existing" ? "default" : "outline"}
          onClick={handleExistingMode}
        >
          {t("ui.characterDetail.targetExisting")}
        </Button>
        <Button
          size="sm"
          variant={mode === "external" ? "default" : "outline"}
          onClick={handleExternalMode}
        >
          {t("ui.characterDetail.targetExternal")}
        </Button>
      </UiDiv>

      {mode === "existing" ? (
        <FormSelect
          value={form.targetCharacterId}
          onChange={handleTargetCharacterIdChange}
        >
          <option value="">
            {t("ui.characterDetail.selectRelationshipTarget")}
          </option>
          {targetOptions.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </FormSelect>
      ) : (
        <FormInput
          value={form.targetSnapshotName}
          placeholder={t("ui.characterDetail.externalName")}
          onChange={handleTargetSnapshotNameChange}
        />
      )}

      <FormSelect value={categoryValue} onChange={handleCategoryIdChange}>
        <option value="">{t("ui.characterDetail.category")}</option>
        {catalog.categories.map((entry) => (
          <option key={entry.id} value={String(entry.id)}>
            {entry.key}
          </option>
        ))}
      </FormSelect>

      <FormSelect value={labelPresetValue} onChange={handleLabelPresetIdChange}>
        <option value="">{t("ui.characterDetail.label")}</option>
        {catalog.labels.map((entry) => (
          <option key={entry.id} value={String(entry.id)}>
            {entry.key}
          </option>
        ))}
      </FormSelect>

      <FormInput
        value={form.labelCustom}
        placeholder={t("ui.characterDetail.customLabel")}
        onChange={handleLabelCustomChange}
      />

      <FormTextarea
        size="md"
        value={form.description}
        placeholder={t("ui.fields.description")}
        onChange={handleDescriptionChange}
      />
    </UiDiv>
  );
};

type AssignCampaignModalProps = {
  t: Translator;
  open: boolean;
  anyPending: boolean;
  selectedCampaignId: string;
  campaigns: Campaign[];
  onClose: () => void;
  onSelectedCampaignIdChange: (value: string) => void;
  onAssign: () => void | Promise<void>;
};

const AssignCampaignModal = ({
  t,
  open,
  anyPending,
  selectedCampaignId,
  campaigns,
  onClose,
  onSelectedCampaignIdChange,
  onAssign,
}: AssignCampaignModalProps) => {
  const handleSelectedCampaignIdChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    onSelectedCampaignIdChange(event.target.value);
  };

  return (
    <Modal
      open={open}
      title={t("ui.characterDetail.assignCampaign")}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("ui.actions.close")}
          </Button>
          <Button
            disabled={anyPending || !selectedCampaignId}
            onClick={onAssign}
          >
            {t("ui.actions.assign")}
          </Button>
        </>
      }
    >
      <FormSelect
        value={selectedCampaignId}
        onChange={handleSelectedCampaignIdChange}
      >
        <option value="">{t("ui.characterDetail.selectCampaign")}</option>
        {campaigns.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.title}
          </option>
        ))}
      </FormSelect>
    </Modal>
  );
};

type UnassignCampaignModalProps = {
  t: Translator;
  open: boolean;
  anyPending: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

const UnassignCampaignModal = ({
  t,
  open,
  anyPending,
  onClose,
  onConfirm,
}: UnassignCampaignModalProps) => {
  return (
    <Modal
      open={open}
      title={t("ui.characterDetail.removeFromCampaign")}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("ui.actions.close")}
          </Button>
          <Button
            variant="destructive"
            disabled={anyPending}
            onClick={onConfirm}
          >
            {t("ui.actions.confirm")}
          </Button>
        </>
      }
    >
      <UiDiv stack={2} textStyle="sm">
        <UiDiv>{t("ui.characterDetail.unassignConfirm")}</UiDiv>
        <UiDiv textStyle="muted-xs">
          {t("ui.characterDetail.unassignInfo")}
        </UiDiv>
      </UiDiv>
    </Modal>
  );
};

type AddRelationshipModalProps = {
  t: Translator;
  open: boolean;
  anyPending: boolean;
  mode: RelationshipTargetMode;
  form: RelationshipAddFormValues;
  targetOptions: RelationshipTargetOption[];
  catalog: RelationshipCatalog;
  defaultCategoryId: string;
  defaultLabelPresetId: string;
  onClose: () => void;
  onModeChange: (mode: RelationshipTargetMode) => void;
  onFormChange: Dispatch<SetStateAction<RelationshipAddFormValues>>;
  onCreate: () => void | Promise<void>;
};

const AddRelationshipModal = ({
  t,
  open,
  anyPending,
  mode,
  form,
  targetOptions,
  catalog,
  defaultCategoryId,
  defaultLabelPresetId,
  onClose,
  onModeChange,
  onFormChange,
  onCreate,
}: AddRelationshipModalProps) => {
  const handleFirstTimelineEntryChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    onFormChange((prev) => ({
      ...prev,
      firstTimelineEntry: event.target.value,
    }));
  };

  return (
    <Modal
      open={open}
      title={t("ui.characterDetail.addRelationship")}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("ui.actions.close")}
          </Button>
          <Button disabled={anyPending} onClick={onCreate}>
            {t("ui.actions.create")}
          </Button>
        </>
      }
    >
      <UiDiv gridGap={2}>
        <RelationshipFormFields
          t={t}
          mode={mode}
          onModeChange={onModeChange}
          targetOptions={targetOptions}
          catalog={catalog}
          form={form}
          onFormChange={onFormChange}
          categoryValue={form.categoryId || defaultCategoryId}
          labelPresetValue={form.labelPresetId || defaultLabelPresetId}
        />
        <FormTextarea
          size="md"
          placeholder={t("ui.characterDetail.firstTimelineEntry")}
          value={form.firstTimelineEntry}
          onChange={handleFirstTimelineEntryChange}
        />
      </UiDiv>
    </Modal>
  );
};

type EditRelationshipModalProps = {
  t: Translator;
  open: boolean;
  anyPending: boolean;
  hasRelation: boolean;
  mode: RelationshipTargetMode;
  form: RelationshipEditFormValues;
  targetOptions: RelationshipTargetOption[];
  catalog: RelationshipCatalog;
  onClose: () => void;
  onModeChange: (mode: RelationshipTargetMode) => void;
  onFormChange: Dispatch<SetStateAction<RelationshipEditFormValues>>;
  onSave: () => void | Promise<void>;
};

const EditRelationshipModal = ({
  t,
  open,
  anyPending,
  hasRelation,
  mode,
  form,
  targetOptions,
  catalog,
  onClose,
  onModeChange,
  onFormChange,
  onSave,
}: EditRelationshipModalProps) => {
  return (
    <Modal
      open={open}
      title={t("ui.characterDetail.editRelationship")}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("ui.actions.close")}
          </Button>
          <Button disabled={anyPending || !hasRelation} onClick={onSave}>
            {t("ui.actions.save")}
          </Button>
        </>
      }
    >
      <RelationshipFormFields
        t={t}
        mode={mode}
        onModeChange={onModeChange}
        targetOptions={targetOptions}
        catalog={catalog}
        form={form}
        onFormChange={onFormChange}
        categoryValue={form.categoryId}
        labelPresetValue={form.labelPresetId}
      />
    </Modal>
  );
};

type DeleteRelationshipModalProps = {
  t: Translator;
  open: boolean;
  anyPending: boolean;
  hasRelation: boolean;
  onClose: () => void;
  onDelete: () => void | Promise<void>;
};

const DeleteRelationshipModal = ({
  t,
  open,
  anyPending,
  hasRelation,
  onClose,
  onDelete,
}: DeleteRelationshipModalProps) => {
  return (
    <Modal
      open={open}
      title={t("ui.characterDetail.deleteRelationship")}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("ui.actions.close")}
          </Button>
          <Button
            variant="destructive"
            disabled={anyPending || !hasRelation}
            onClick={onDelete}
          >
            {t("ui.actions.confirmDelete")}
          </Button>
        </>
      }
    >
      <UiDiv textStyle="sm">
        {t("ui.characterDetail.deleteRelationshipConfirm")}
      </UiDiv>
    </Modal>
  );
};

type RelationshipDetailModalProps = {
  t: Translator;
  open: boolean;
  detail: RelationshipDetail | null;
  onClose: () => void;
};

const RelationshipDetailModal = ({
  t,
  open,
  detail,
  onClose,
}: RelationshipDetailModalProps) => {
  return (
    <Modal
      open={open}
      title={t("ui.characterDetail.relationshipDetail")}
      onClose={onClose}
      footer={
        <Button variant="outline" onClick={onClose}>
          {t("ui.actions.close")}
        </Button>
      }
    >
      {detail ? (
        <UiDiv stack={3} textStyle="sm">
          <UiDiv surface="outlined-box">
            <UiDiv textStyle="medium">
              {t("ui.characterDetail.howThisSeesOther")}
            </UiDiv>
            <UiPre format="log">
              {JSON.stringify(detail.outgoing, null, 2)}
            </UiPre>
          </UiDiv>
          <UiDiv surface="outlined-box">
            <UiDiv textStyle="medium">
              {t("ui.characterDetail.howOtherSeesThis")}
            </UiDiv>
            <UiPre format="log">
              {JSON.stringify(detail.incoming, null, 2)}
            </UiPre>
          </UiDiv>
          <UiDiv surface="outlined-box">
            <UiDiv textStyle="medium">{t("ui.characterDetail.timeline")}</UiDiv>
            <UiPre format="log">
              {JSON.stringify(detail.timeline, null, 2)}
            </UiPre>
          </UiDiv>
        </UiDiv>
      ) : null}
    </Modal>
  );
};

export type {
  RelationshipAddFormValues,
  RelationshipEditFormValues,
  RelationshipTargetMode,
};
export {
  AddRelationshipModal,
  AssignCampaignModal,
  DeleteRelationshipModal,
  EditRelationshipModal,
  RelationshipDetailModal,
  UnassignCampaignModal,
};
