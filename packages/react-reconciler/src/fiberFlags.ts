export type Flag =
	| typeof NoFlags
	| typeof Placement
	| typeof Update
	| typeof Deletion;

export const NoFlags = 0b0000000;
export const Placement = 0b0000001;
export const Update = 0b000010;
export const Deletion = 0b000100;

export const MutationMask = Placement | Update | Deletion;
