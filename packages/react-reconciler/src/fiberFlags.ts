export type Flag =
	| typeof NoFlags
	| typeof Placement
	| typeof Update
	| typeof Deletion;

export const NoFlags = 0b0000001;
export const Placement = 0b0000010;
export const Update = 0b000100;
export const Deletion = 0b001000;
