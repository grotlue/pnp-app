import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/common/modal";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/common/form-controls";
import type { Campaign } from "@/features/campaigns/types";
import type {
  RelationshipCatalog,
  RelationshipDetail,
} from "@/features/relationships/types";

type Translator = (key: string) => string;

export type RelationshipTargetMode = "existing" | "external";

export type RelationshipAddFormValues = {
  targetCharacterId: string;
  targetSnapshotName: string;
  categoryId: string;
  labelPresetId: string;
  labelCustom: string;
  description: string;
  firstTimelineEntry: string;
};

export type RelationshipEditFormValues = {
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

function RelationshipFormFields<TForm extends RelationshipBaseFormValues>({
  t,
  mode,
  onModeChange,
  targetOptions,
  catalog,
  form,
  onFormChange,
  categoryValue,
  labelPresetValue,
}: RelationshipFormFieldsProps<TForm>) {
  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={mode === "existing" ? "default" : "outline"}
          onClick={() => onModeChange("existing")}
        >
          {t("ui.characterDetail.targetExisting")}
        </Button>
        <Button
          size="sm"
          variant={mode === "external" ? "default" : "outline"}
          onClick={() => onModeChange("external")}
        >
          {t("ui.characterDetail.targetExternal")}
        </Button>
      </div>

      {mode === "existing" ? (
        <FormSelect
          value={form.targetCharacterId}
          onChange={(event) =>
            onFormChange((prev) => ({
              ...prev,
              targetCharacterId: event.target.value,
            }))
          }
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
          onChange={(event) =>
            onFormChange((prev) => ({
              ...prev,
              targetSnapshotName: event.target.value,
            }))
          }
        />
      )}

      <FormSelect
        value={categoryValue}
        onChange={(event) =>
          onFormChange((prev) => ({ ...prev, categoryId: event.target.value }))
        }
      >
        <option value="">{t("ui.characterDetail.category")}</option>
        {catalog.categories.map((entry) => (
          <option key={entry.id} value={String(entry.id)}>
            {entry.key}
          </option>
        ))}
      </FormSelect>

      <FormSelect
        value={labelPresetValue}
        onChange={(event) =>
          onFormChange((prev) => ({
            ...prev,
            labelPresetId: event.target.value,
            labelCustom: "",
          }))
        }
      >
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
        onChange={(event) =>
          onFormChange((prev) => ({
            ...prev,
            labelCustom: event.target.value,
            labelPresetId: "",
          }))
        }
      />

      <FormTextarea
        className="min-h-20"
        value={form.description}
        placeholder={t("ui.fields.description")}
        onChange={(event) =>
          onFormChange((prev) => ({ ...prev, description: event.target.value }))
        }
      />
    </div>
  );
}

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

export function AssignCampaignModal({
  t,
  open,
  anyPending,
  selectedCampaignId,
  campaigns,
  onClose,
  onSelectedCampaignIdChange,
  onAssign,
}: AssignCampaignModalProps) {
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
        onChange={(event) => onSelectedCampaignIdChange(event.target.value)}
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
}

type UnassignCampaignModalProps = {
  t: Translator;
  open: boolean;
  anyPending: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function UnassignCampaignModal({
  t,
  open,
  anyPending,
  onClose,
  onConfirm,
}: UnassignCampaignModalProps) {
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
      <div className="space-y-2 text-sm">
        <div>{t("ui.characterDetail.unassignConfirm")}</div>
        <div className="text-muted-foreground text-xs">
          {t("ui.characterDetail.unassignInfo")}
        </div>
      </div>
    </Modal>
  );
}

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

export function AddRelationshipModal({
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
}: AddRelationshipModalProps) {
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
      <div className="grid gap-2">
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
          className="min-h-20"
          placeholder={t("ui.characterDetail.firstTimelineEntry")}
          value={form.firstTimelineEntry}
          onChange={(event) =>
            onFormChange((prev) => ({
              ...prev,
              firstTimelineEntry: event.target.value,
            }))
          }
        />
      </div>
    </Modal>
  );
}

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

export function EditRelationshipModal({
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
}: EditRelationshipModalProps) {
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
}

type DeleteRelationshipModalProps = {
  t: Translator;
  open: boolean;
  anyPending: boolean;
  hasRelation: boolean;
  onClose: () => void;
  onDelete: () => void | Promise<void>;
};

export function DeleteRelationshipModal({
  t,
  open,
  anyPending,
  hasRelation,
  onClose,
  onDelete,
}: DeleteRelationshipModalProps) {
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
      <div className="text-sm">
        {t("ui.characterDetail.deleteRelationshipConfirm")}
      </div>
    </Modal>
  );
}

type RelationshipDetailModalProps = {
  t: Translator;
  open: boolean;
  detail: RelationshipDetail | null;
  onClose: () => void;
};

export function RelationshipDetailModal({
  t,
  open,
  detail,
  onClose,
}: RelationshipDetailModalProps) {
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
        <div className="space-y-3 text-sm">
          <div className="border-border rounded border p-2">
            <div className="font-medium">
              {t("ui.characterDetail.howThisSeesOther")}
            </div>
            <pre className="mt-1 overflow-auto text-xs whitespace-pre-wrap">
              {JSON.stringify(detail.outgoing, null, 2)}
            </pre>
          </div>
          <div className="border-border rounded border p-2">
            <div className="font-medium">
              {t("ui.characterDetail.howOtherSeesThis")}
            </div>
            <pre className="mt-1 overflow-auto text-xs whitespace-pre-wrap">
              {JSON.stringify(detail.incoming, null, 2)}
            </pre>
          </div>
          <div className="border-border rounded border p-2">
            <div className="font-medium">
              {t("ui.characterDetail.timeline")}
            </div>
            <pre className="mt-1 overflow-auto text-xs whitespace-pre-wrap">
              {JSON.stringify(detail.timeline, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
