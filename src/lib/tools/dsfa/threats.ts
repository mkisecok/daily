import type { Localized } from '../types.js';

/** the seven protection goals of the Standard Data Protection Model (SDM V3.1a, D1) */
export type SdmGoal =
	| 'vertraulichkeit'
	| 'integritaet'
	| 'verfuegbarkeit'
	| 'datenminimierung'
	| 'nichtverkettung'
	| 'transparenz'
	| 'intervenierbarkeit';

/** BSI basic values: confidentiality, integrity, availability */
export type BasicValue = 'C' | 'I' | 'A';

export type Threat = {
	/** `G 0.14` for the BSI catalogue, `DS 3` for the data protection events */
	id: string;
	title: Localized;
	/** BSI basic values affected, as in BSI-Standard 200-3; empty for `DS` threats */
	cia: BasicValue[];
	goals: SdmGoal[];
	/** what the threat means for the people whose data is processed */
	focus: Localized;
};

const L = (de: string, en: string): Localized => ({ de, en });

const ALL: SdmGoal[] = [
	'vertraulichkeit',
	'integritaet',
	'verfuegbarkeit',
	'datenminimierung',
	'nichtverkettung',
	'transparenz',
	'intervenierbarkeit'
];
const GOAL: Record<string, SdmGoal> = {
	Vt: 'vertraulichkeit',
	Ig: 'integritaet',
	Vf: 'verfuegbarkeit',
	Dm: 'datenminimierung',
	Nn: 'nichtverkettung',
	Tp: 'transparenz',
	Iv: 'intervenierbarkeit'
};

function threat(
	id: string,
	title: Localized,
	cia: string,
	goals: string,
	focus: Localized
): Threat {
	return {
		id,
		title,
		cia: cia ? (cia.split(',').map((v) => v.trim()) as BasicValue[]) : [],
		goals: goals === '*' ? ALL : goals.split(',').map((g) => GOAL[g.trim()]),
		focus
	};
}

/**
 * the elementary threats of BSI-Standard 200-3 (G 0.1–G 0.47) with the SDM
 * goals they can violate. Information security risks are one part of a DPIA
 * (SDM V3.1a, D3.1 risk types C and D; D3.2.2); the view stays that of the
 * data subjects, not of the organisation.
 */
export const BSI_THREATS: Threat[] = [
	threat(
		'G 0.1',
		L('Feuer', 'Fire'),
		'A',
		'Vf',
		L('Akten und Server gehen verloren.', 'Files and servers are lost.')
	),
	threat(
		'G 0.2',
		L('Ungünstige klimatische Bedingungen', 'Unfavourable climatic conditions'),
		'I, A',
		'Vf, Ig',
		L('Überhitzung beschädigt Systeme und Daten.', 'Overheating damages systems and data.')
	),
	threat(
		'G 0.3',
		L('Wasser', 'Water'),
		'I, A',
		'Vf, Ig',
		L('Speicher und Sicherungen werden zerstört.', 'Storage and backups are destroyed.')
	),
	threat(
		'G 0.4',
		L('Verschmutzung, Staub, Korrosion', 'Contamination, dust, corrosion'),
		'I, A',
		'Vf, Ig',
		L('Geräte fallen aus oder lesen fehlerhaft.', 'Devices fail or read data wrongly.')
	),
	threat(
		'G 0.5',
		L('Naturkatastrophen', 'Natural disasters'),
		'A',
		'Vf',
		L('Ein Standort fällt ganz aus.', 'A whole site goes down.')
	),
	threat(
		'G 0.6',
		L('Katastrophen im Umfeld', 'Disasters in the vicinity'),
		'A',
		'Vf',
		L('Räumung unterbricht den Zugriff auf Daten.', 'An evacuation interrupts access to the data.')
	),
	threat(
		'G 0.7',
		L('Großereignisse im Umfeld', 'Major events in the vicinity'),
		'C, I, A',
		'Vf, Ig, Vt',
		L(
			'Überlastete Netze, Unbefugte gelangen in Räume.',
			'Overloaded networks, unauthorised people enter the premises.'
		)
	),
	threat(
		'G 0.8',
		L('Ausfall oder Störung der Stromversorgung', 'Failure or disruption of the power supply'),
		'I, A',
		'Vf, Ig',
		L(
			'Abgebrochene Vorgänge hinterlassen beschädigte Datensätze.',
			'Interrupted operations leave damaged records.'
		)
	),
	threat(
		'G 0.9',
		L(
			'Ausfall oder Störung von Kommunikationsnetzen',
			'Failure or disruption of communication networks'
		),
		'I, A',
		'Vf, Ig, Iv',
		L(
			'Betroffene erreichen den Verantwortlichen nicht, Anträge bleiben liegen.',
			'Data subjects cannot reach the controller, requests are left unanswered.'
		)
	),
	threat(
		'G 0.10',
		L('Ausfall oder Störung von Versorgungsnetzen', 'Failure or disruption of utility networks'),
		'A',
		'Vf',
		L('Ohne Kühlung oder Wasser stehen Systeme still.', 'Without cooling or water, systems stop.')
	),
	threat(
		'G 0.11',
		L('Ausfall oder Störung von Dienstleistern', 'Failure or disruption of service providers'),
		'C, I, A',
		'Vf, Ig, Vt, Iv, Tp',
		L(
			'Ein Auftragsverarbeiter fällt aus oder hält Art. 28 DSGVO nicht ein.',
			'A processor fails or does not comply with Art. 28 GDPR.'
		)
	),
	threat(
		'G 0.12',
		L('Elektromagnetische Störstrahlung', 'Electromagnetic interference'),
		'I, A',
		'Vf, Ig',
		L('Übertragene Daten werden verfälscht.', 'Transmitted data is corrupted.')
	),
	threat(
		'G 0.13',
		L('Abfangen kompromittierender Strahlung', 'Interception of compromising emissions'),
		'C',
		'Vt',
		L('Daten werden über Abstrahlung passiv mitgelesen.', 'Data is read passively from emissions.')
	),
	threat(
		'G 0.14',
		L('Ausspähen von Informationen/Spionage', 'Interception of information / espionage'),
		'C',
		'Vt, Tp',
		L(
			'Gezielter Abfluss von Daten, meist meldepflichtig.',
			'Targeted exfiltration of data, usually notifiable.'
		)
	),
	threat(
		'G 0.15',
		L('Abhören', 'Eavesdropping'),
		'C',
		'Vt',
		L('Unverschlüsselte Kommunikation wird mitgehört.', 'Unencrypted communication is overheard.')
	),
	threat(
		'G 0.16',
		L(
			'Diebstahl von Geräten, Datenträgern und Dokumenten',
			'Theft of devices, storage media and documents'
		),
		'C, A',
		'Vt, Vf',
		L(
			'Unverschlüsselte Endgeräte oder Akten gelangen in fremde Hände.',
			'Unencrypted devices or files fall into other hands.'
		)
	),
	threat(
		'G 0.17',
		L(
			'Verlust von Geräten, Datenträgern und Dokumenten',
			'Loss of devices, storage media and documents'
		),
		'C, A',
		'Vt, Vf',
		L('USB-Sticks oder Unterlagen gehen verloren.', 'USB sticks or papers are lost.')
	),
	threat(
		'G 0.18',
		L('Fehlplanung oder fehlende Anpassung', 'Poor planning or lack of adaptation'),
		'C, I, A',
		'*',
		L(
			'Datenschutz durch Technikgestaltung (Art. 25 DSGVO) wird verfehlt.',
			'Data protection by design (Art. 25 GDPR) is missed.'
		)
	),
	threat(
		'G 0.19',
		L('Offenlegung schützenswerter Informationen', 'Disclosure of sensitive information'),
		'C',
		'Vt, Tp',
		L(
			'Fehlversand, etwa ein offener E-Mail-Verteiler.',
			'Misdirected mail, e.g. an open mailing list.'
		)
	),
	threat(
		'G 0.20',
		L('Informationen aus unzuverlässiger Quelle', 'Information from an unreliable source'),
		'C, I, A',
		'Ig, Tp',
		L(
			'Entscheidungen beruhen auf unrichtigen Daten (Art. 5 Abs. 1 lit. d DSGVO).',
			'Decisions rest on inaccurate data (Art. 5(1)(d) GDPR).'
		)
	),
	threat(
		'G 0.21',
		L('Manipulation von Hard- und Software', 'Manipulation of hardware or software'),
		'C, I, A',
		'Ig, Vt, Vf, Tp',
		L('Hintertüren unterlaufen die Schutzmaßnahmen.', 'Backdoors undermine the safeguards.')
	),
	threat(
		'G 0.22',
		L('Manipulation von Informationen', 'Manipulation of information'),
		'I',
		'Ig, Iv, Tp',
		L(
			'Datensätze werden verfälscht, Betroffene merken es nicht.',
			'Records are falsified without the data subjects noticing.'
		)
	),
	threat(
		'G 0.23',
		L('Unbefugtes Eindringen in IT-Systeme', 'Unauthorised access to IT systems'),
		'C, I',
		'Vt, Ig, Tp',
		L('Angreifer ziehen Daten ab.', 'Attackers exfiltrate data.')
	),
	threat(
		'G 0.24',
		L('Zerstörung von Geräten oder Datenträgern', 'Destruction of devices or storage media'),
		'A',
		'Vf',
		L('Ohne Sicherung sind die Daten verloren.', 'Without a backup the data is lost.')
	),
	threat(
		'G 0.25',
		L('Ausfall von Geräten oder Systemen', 'Failure of devices or systems'),
		'A',
		'Vf',
		L('Daten fehlen, wenn Betroffene sie brauchen.', 'Data is missing when data subjects need it.')
	),
	threat(
		'G 0.26',
		L('Fehlfunktion von Geräten oder Systemen', 'Malfunction of devices or systems'),
		'C, I, A',
		'Ig, Vf, Vt',
		L(
			'Fehler erzeugen falsche Auskünfte oder zeigen fremde Daten.',
			'Errors produce wrong information or show other people’s data.'
		)
	),
	threat(
		'G 0.27',
		L('Ressourcenmangel', 'Lack of resources'),
		'A',
		'Vf, Iv',
		L(
			'Überlastete Systeme verzögern Auskünfte und Löschungen.',
			'Overloaded systems delay access requests and erasure.'
		)
	),
	threat(
		'G 0.28',
		L('Softwareschwachstellen oder -fehler', 'Software vulnerabilities or errors'),
		'C, I, A',
		'Vt, Ig, Vf, Nn',
		L(
			'Etwa eine Sitzung, die Konten verschiedener Personen vermischt.',
			'For example a session that mixes up different people’s accounts.'
		)
	),
	threat(
		'G 0.29',
		L('Verstoß gegen Gesetze oder Regelungen', 'Violation of laws or regulations'),
		'C, I, A',
		'*',
		L(
			'Die Verarbeitung ist unrechtmäßig; die Rechtsgrundlage ist vorab zu prüfen (Art. 6 DSGVO).',
			'The processing is unlawful; the legal basis must be checked first (Art. 6 GDPR).'
		)
	),
	threat(
		'G 0.30',
		L(
			'Unberechtigte Nutzung oder Administration von Geräten und Systemen',
			'Unauthorised use or administration of devices and systems'
		),
		'C, I, A',
		'Vt, Ig, Nn, Tp',
		L(
			'Administratoren lesen Daten, die sie nicht brauchen.',
			'Administrators read data they do not need.'
		)
	),
	threat(
		'G 0.31',
		L(
			'Fehlerhafte Nutzung oder Administration von Geräten und Systemen',
			'Incorrect use or administration of devices and systems'
		),
		'C, I, A',
		'Ig, Vf, Dm',
		L(
			'Eine Fehlkonfiguration setzt etwa die Löschung außer Kraft.',
			'A misconfiguration disables erasure, for instance.'
		)
	),
	threat(
		'G 0.32',
		L('Missbrauch von Berechtigungen', 'Abuse of authorisations'),
		'C, I, A',
		'Vt, Nn, Dm, Tp',
		L('Beschäftigte nutzen Daten für eigene Zwecke.', 'Staff use data for their own purposes.')
	),
	threat(
		'G 0.33',
		L('Personalausfall', 'Absence of personnel'),
		'A',
		'Vf, Iv',
		L(
			'Fristen für Betroffenenrechte werden versäumt.',
			'Deadlines for data subject rights are missed.'
		)
	),
	threat(
		'G 0.34',
		L('Anschlag', 'Attack'),
		'C, I, A',
		'Vf, Ig, Vt',
		L('Physische Sabotage der IT.', 'Physical sabotage of the IT.')
	),
	threat(
		'G 0.35',
		L('Nötigung, Erpressung oder Korruption', 'Coercion, extortion or corruption'),
		'C, I, A',
		'Vt, Ig, Tp',
		L('Personendaten werden erpresst herausgegeben.', 'Personal data is handed over under duress.')
	),
	threat(
		'G 0.36',
		L('Identitätsdiebstahl', 'Identity theft'),
		'C, I, A',
		'Vt, Ig, Iv',
		L(
			'Jemand erschleicht sich Auskunft über fremde Daten.',
			'Someone obtains access to another person’s data by deception.'
		)
	),
	threat(
		'G 0.37',
		L('Abstreiten von Handlungen', 'Repudiation of actions'),
		'C, I',
		'Tp, Ig',
		L(
			'Ohne revisionsfeste Protokolle ist nichts nachweisbar.',
			'Without tamper-proof logs nothing can be proven.'
		)
	),
	threat(
		'G 0.38',
		L('Missbrauch personenbezogener Daten', 'Misuse of personal data'),
		'C',
		'Vt, Nn, Dm',
		L('Unzulässige Profilbildung oder Weitergabe.', 'Unlawful profiling or disclosure.')
	),
	threat(
		'G 0.39',
		L('Schadprogramme', 'Malware'),
		'C, I, A',
		'Vt, Ig, Vf, Tp',
		L(
			'Ransomware verschlüsselt Daten und zieht sie ab.',
			'Ransomware encrypts data and exfiltrates it.'
		)
	),
	threat(
		'G 0.40',
		L('Verhinderung von Diensten (Denial of Service)', 'Denial of service'),
		'A',
		'Vf',
		L(
			'Dienste für Betroffene sind nicht erreichbar.',
			'Services for data subjects are unavailable.'
		)
	),
	threat(
		'G 0.41',
		L('Sabotage', 'Sabotage'),
		'A',
		'Vf, Ig',
		L('Datenbanken werden gezielt zerstört.', 'Databases are destroyed on purpose.')
	),
	threat(
		'G 0.42',
		L('Social Engineering', 'Social engineering'),
		'C, I',
		'Vt, Ig, Iv',
		L(
			'Täuschung am Telefon umgeht den Schutz.',
			'Deception on the phone gets round the safeguards.'
		)
	),
	threat(
		'G 0.43',
		L('Einspielen von Nachrichten', 'Replay of messages'),
		'C, I',
		'Ig, Vt',
		L('Gefälschte Aufträge oder Einwilligungen.', 'Forged instructions or consents.')
	),
	threat(
		'G 0.44',
		L('Unbefugtes Eindringen in Räumlichkeiten', 'Unauthorised entry to premises'),
		'C, I, A',
		'Vt, Vf, Ig',
		L('Zutritt zu Serverräumen oder Archiven.', 'Entry to server rooms or archives.')
	),
	threat(
		'G 0.45',
		L('Datenverlust', 'Data loss'),
		'A',
		'Vf',
		L(
			'Daten sind ohne Sicherung unwiederbringlich verloren.',
			'Data is irretrievably lost without a backup.'
		)
	),
	threat(
		'G 0.46',
		L(
			'Integritätsverlust schützenswerter Informationen',
			'Loss of integrity of sensitive information'
		),
		'I',
		'Ig, Tp',
		L('Daten werden schleichend verfälscht.', 'Data is gradually corrupted.')
	),
	threat(
		'G 0.47',
		L(
			'Schädliche Seiteneffekte IT-gestützter Angriffe',
			'Harmful side effects of IT-based attacks'
		),
		'C, I, A',
		'Vf, Ig, Vt',
		L(
			'Eine Notabschaltung unterbricht den Betrieb.',
			'An emergency shutdown interrupts operations.'
		)
	)
];

/**
 * data protection events that the BSI catalogue does not cover: the risks of
 * the planned processing itself (DSK Kurzpapier Nr. 18, IV.1 b; SDM V3.1a,
 * D3.1 risk types A and B)
 */
export const DS_THREATS: Threat[] = [
	threat(
		'DS 1',
		L('Unbefugte oder unrechtmäßige Verarbeitung', 'Unauthorised or unlawful processing'),
		'',
		'Nn, Dm, Tp',
		L(
			'Daten werden ohne tragfähige Rechtsgrundlage verarbeitet.',
			'Data is processed without a sound legal basis.'
		)
	),
	threat(
		'DS 2',
		L('Verarbeitung wider Treu und Glauben', 'Processing contrary to good faith'),
		'',
		'Tp, Iv',
		L(
			'Betroffene müssen mit der Verarbeitung nicht rechnen.',
			'Data subjects cannot reasonably expect the processing.'
		)
	),
	threat(
		'DS 3',
		L('Intransparente Verarbeitung', 'Opaque processing'),
		'',
		'Tp',
		L(
			'Betroffene erfahren nicht, wer was wozu verarbeitet (Art. 12–14 DSGVO).',
			'Data subjects do not learn who processes what and why (Art. 12–14 GDPR).'
		)
	),
	threat(
		'DS 4',
		L('Verweigerung der Betroffenenrechte', 'Denial of data subject rights'),
		'',
		'Iv, Tp',
		L(
			'Auskunft, Berichtigung, Löschung oder Widerspruch laufen ins Leere.',
			'Access, rectification, erasure or objection come to nothing.'
		)
	),
	threat(
		'DS 5',
		L('Verwendung zu inkompatiblen Zwecken', 'Use for incompatible purposes'),
		'',
		'Nn',
		L(
			'Daten werden über den Erhebungszweck hinaus genutzt (Art. 5 Abs. 1 lit. b DSGVO).',
			'Data is used beyond the purpose it was collected for (Art. 5(1)(b) GDPR).'
		)
	),
	threat(
		'DS 6',
		L('Verkettung und Profilbildung', 'Linkage and profiling'),
		'',
		'Nn, Dm',
		L(
			'Datenbestände werden zusammengeführt und Personen bewertet.',
			'Datasets are combined and people are evaluated.'
		)
	),
	threat(
		'DS 7',
		L('Verarbeitung nicht erforderlicher Daten', 'Processing of data that is not needed'),
		'',
		'Dm',
		L(
			'Es werden mehr Daten erhoben als für den Zweck nötig (Art. 5 Abs. 1 lit. c DSGVO).',
			'More data is collected than the purpose needs (Art. 5(1)(c) GDPR).'
		)
	),
	threat(
		'DS 8',
		L('Verarbeitung unrichtiger Daten', 'Processing of inaccurate data'),
		'',
		'Ig, Iv',
		L(
			'Falsche Daten führen zu falschen Entscheidungen über Personen.',
			'Wrong data leads to wrong decisions about people.'
		)
	),
	threat(
		'DS 9',
		L('Verarbeitung über die Speicherfrist hinaus', 'Processing beyond the retention period'),
		'',
		'Dm, Iv',
		L(
			'Daten werden nicht gelöscht, wenn der Zweck entfällt (Art. 5 Abs. 1 lit. e DSGVO).',
			'Data is not erased once the purpose ends (Art. 5(1)(e) GDPR).'
		)
	),
	threat(
		'DS 10',
		L(
			'Automatisierte Entscheidung ohne Eingriffsmöglichkeit',
			'Automated decision without recourse'
		),
		'',
		'Iv, Tp',
		L(
			'Eine Maschine entscheidet ohne menschliche Überprüfung (Art. 22 DSGVO).',
			'A machine decides without human review (Art. 22 GDPR).'
		)
	)
];

export const THREATS: Threat[] = [...BSI_THREATS, ...DS_THREATS];

/** the threats that can violate one goal, BSI catalogue first */
export function threatsFor(goal: SdmGoal): Threat[] {
	return THREATS.filter((threat) => threat.goals.includes(goal));
}

export function threatById(id: string): Threat | undefined {
	return THREATS.find((threat) => threat.id === id);
}
