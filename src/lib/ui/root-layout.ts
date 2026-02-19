type RootBodyClassNameInput = {
  sansVariable: string;
  monoVariable: string;
};

export function getRootBodyClassName({
  sansVariable,
  monoVariable,
}: RootBodyClassNameInput) {
  return [sansVariable, monoVariable, "antialiased"].join(" ");
}

export function getRootBodyProps(input: RootBodyClassNameInput) {
  return {
    className: getRootBodyClassName(input),
  };
}
