import * as React from "react";
import type { ChangeEvent, ComponentPropsWithoutRef, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formControlClass = "";

const FormInput = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"input">) => {
  return <Input className={className} {...props} />;
};

const FormTextarea = ({
  className,
  size: _size,
  ...props
}: ComponentPropsWithoutRef<"textarea"> & {
  size?: "default" | "md" | "lg";
}) => {
  void _size;
  return <Textarea className={className} {...props} />;
};

const FormSelect = ({
  children,
  className,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  name,
  id,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  "aria-label"?: string;
}) => {
  type ParsedOption = {
    value: string;
    label: ReactNode;
    disabled: boolean;
  };

  type ParsedGroup = {
    label?: string;
    options: ParsedOption[];
  };

  type OptionNodeProps = {
    value?: string;
    disabled?: boolean;
    children?: ReactNode;
  };

  type OptGroupNodeProps = {
    label?: string;
    children?: ReactNode;
  };

  const EMPTY_SENTINEL = "__form_select_empty__";

  const encodeValue = (rawValue: string) => {
    return rawValue === "" ? EMPTY_SENTINEL : rawValue;
  };

  const decodeValue = (encodedValue: string) => {
    return encodedValue === EMPTY_SENTINEL ? "" : encodedValue;
  };

  const isOptionElement = (
    node: ReactNode,
  ): node is React.ReactElement<OptionNodeProps, "option"> => {
    return (
      React.isValidElement<OptionNodeProps>(node) && node.type === "option"
    );
  };

  const isOptGroupElement = (
    node: ReactNode,
  ): node is React.ReactElement<OptGroupNodeProps, "optgroup"> => {
    return (
      React.isValidElement<OptGroupNodeProps>(node) && node.type === "optgroup"
    );
  };

  const parseOptionNode = (node: ReactNode): ParsedOption | null => {
    if (!isOptionElement(node)) {
      return null;
    }

    const nodeValue = node.props.value;
    const valueText =
      nodeValue === undefined || nodeValue === null
        ? String(node.props.children ?? "")
        : String(nodeValue);

    return {
      value: valueText,
      label: node.props.children,
      disabled: Boolean(node.props.disabled),
    };
  };

  const parseGroups = (nodes: React.ReactNode): ParsedGroup[] => {
    const ungrouped: ParsedOption[] = [];
    const groups: ParsedGroup[] = [];

    React.Children.forEach(nodes, (node) => {
      if (isOptGroupElement(node)) {
        const groupOptions: ParsedOption[] = [];
        React.Children.forEach(node.props.children, (groupChild) => {
          const parsed = parseOptionNode(groupChild);
          if (parsed) {
            groupOptions.push(parsed);
          }
        });

        if (groupOptions.length > 0) {
          groups.push({
            label:
              node.props.label === undefined
                ? undefined
                : String(node.props.label),
            options: groupOptions,
          });
        }
        return;
      }

      const parsed = parseOptionNode(node);
      if (parsed) {
        ungrouped.push(parsed);
      }
    });

    return [
      ...(ungrouped.length > 0 ? [{ options: ungrouped }] : []),
      ...groups,
    ];
  };

  const parsedGroups = parseGroups(children);
  const placeholderOption =
    parsedGroups
      .flatMap((group) => group.options)
      .find((option) => option.value === "") ?? null;

  const isControlled = value !== undefined;
  const encodedValue = isControlled ? encodeValue(value) : undefined;
  const encodedDefaultValue =
    defaultValue !== undefined ? encodeValue(defaultValue) : undefined;
  const handleValueChange = (nextValue: unknown) => {
    if (!onChange) {
      return;
    }

    onChange({
      target: { value: decodeValue(String(nextValue ?? "")) },
    } as ChangeEvent<HTMLSelectElement>);
  };

  return (
    <Select
      value={encodedValue}
      defaultValue={encodedDefaultValue}
      disabled={disabled}
      required={required}
      name={name}
      onValueChange={handleValueChange}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} className={className}>
        <SelectValue
          placeholder={
            typeof placeholderOption?.label === "string"
              ? placeholderOption.label
              : undefined
          }
        />
      </SelectTrigger>
      <SelectContent>
        {parsedGroups.map((group, groupIndex) => {
          const groupItems = group.options.map((option) => (
            <SelectItem
              key={`${groupIndex}-${option.value}`}
              value={encodeValue(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ));

          if (!group.label) {
            return (
              <React.Fragment key={`group-${groupIndex}`}>
                {groupItems}
              </React.Fragment>
            );
          }

          return (
            <SelectGroup key={`group-${groupIndex}`}>
              <SelectLabel>{group.label}</SelectLabel>
              {groupItems}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
};

const FormLabel = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"label">) => {
  return <label className={className} {...props} />;
};

export { FormInput, FormLabel, FormSelect, FormTextarea, formControlClass };
