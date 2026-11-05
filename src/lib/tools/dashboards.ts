import type { Component } from 'svelte';
import type { RecordView } from '../records/types.js';
import DsfaDashboard from './dsfa/DsfaDashboard.svelte';
import RiskPyramid from './risikoklassifizierung/RiskPyramid.svelte';
import type { QuestionnaireResult } from './types.js';

/** a picture of a record's state shown above its fields, by tool slug */
export const recordDashboards: Partial<Record<string, Component<{ record: RecordView }>>> = {
	dsfa: DsfaDashboard
};

/** a picture of a questionnaire result shown beside its verdict, by tool slug */
export const resultDashboards: Partial<Record<string, Component<{ result: QuestionnaireResult }>>> =
	{
		risikoklassifizierung: RiskPyramid
	};
