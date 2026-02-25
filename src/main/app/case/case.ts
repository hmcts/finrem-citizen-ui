// import { AnyObject } from '../controller/PostController';

import {
  AddressGlobalUK,
  AlternativeServiceDifferentWays,
  AlternativeServiceMethod,
  AlternativeServiceOutcome,
  AlternativeServiceType,
  Applicant2Represented,
  ApplicationType,
  CaseData,
  ChangedNameHow,
  ChangedNameWhy,
  ClarificationReason,
  ClarificationResponse,
  ConditionalOrderCourt,
  DateAsString,
  DivorceDocument,
  DivorceOrDissolution,
  DocumentType,
  FinancialOrderFor,
  Gender,
  GeneralApplication,
  InterimApplicationType,
  JurisdictionConnections,
  LegalAdvisorDecision,
  ListValue,
  NoResponseCheckContactDetails,
  NoResponseNoNewAddressDetails,
  NoResponseOwnSearches,
  NoResponsePartnerNewEmailOrAddress,
  NoResponseProcessServerOrBailiff,
  NoResponseProvidePartnerNewEmailOrAlternativeService,
  NoResponseSearchOrDispense,
  NoResponseSendPapersAgainOrTrySomethingElse,
  OrderSummary,
  Payment,
  RequestForInformation,
  SearchGovRecordsWhichDepartment,
  ServiceMethod,
  ServicePaymentMethod,
  State,
  YesOrNo,
  YesOrNoOrNotKnown,
} from './definition';

export const formFieldsToCaseMapping: Partial<Record<keyof Case, keyof CaseData>> = {
  applicationType: 'applicationType',
  divorceOrDissolution: 'divorceOrDissolution',
  gender: 'applicant2Gender',
  applicant1ScreenHasUnionBroken: 'applicant1ScreenHasMarriageBroken',
  applicant2ScreenHasUnionBroken: 'applicant2ScreenHasMarriageBroken',
  hasCertificate: 'screenHasMarriageCert',
  applicant1HelpPayingNeeded: 'applicant1HWFNeedHelp',
  applicant1AlreadyAppliedForHelpPaying: 'applicant1HWFAppliedForFees',
  applicant1HelpWithFeesRefNo: 'applicant1HWFReferenceNumber',
  applicant2HelpPayingNeeded: 'applicant2HWFNeedHelp',
  applicant2AlreadyAppliedForHelpPaying: 'applicant2HWFAppliedForFees',
  applicant2HelpWithFeesRefNo: 'applicant2HWFReferenceNumber',
  applicant2FoHelpPayingNeeded: 'applicant2FoHWFNeedHelp',
  applicant2FoAlreadyAppliedForHelpPaying: 'applicant2FoHWFAppliedForFees',
  applicant2FoHelpWithFeesRefNo: 'applicant2FoHWFReferenceNumber',
  inTheUk: 'marriageMarriedInUk',
  certificateInEnglish: 'marriageCertificateInEnglish',
  certifiedTranslation: 'marriageCertifiedTranslation',
  ceremonyCountry: 'marriageCountryOfMarriage',
  ceremonyPlace: 'marriagePlaceOfMarriage',
  applicant1LifeBasedInEnglandAndWales: 'jurisdictionApplicant1Residence',
  applicant2LifeBasedInEnglandAndWales: 'jurisdictionApplicant2Residence',
  applicant1DomicileInEnglandWales: 'jurisdictionApplicant1Domicile',
  applicant2DomicileInEnglandWales: 'jurisdictionApplicant2Domicile',
  bothLastHabituallyResident: 'jurisdictionBothLastHabituallyResident',
  applicant1LivingInEnglandWalesTwelveMonths: 'jurisdictionApp1HabituallyResLastTwelveMonths',
  applicant1LivingInEnglandWalesSixMonths: 'jurisdictionApp1HabituallyResLastSixMonths',
  connections: 'jurisdictionConnections',
  jurisdictionResidualEligible: 'jurisdictionResidualEligible',
  applicant1PhoneNumber: 'applicant1PhoneNumber',
  applicant1FirstNames: 'applicant1FirstName',
  applicant1MiddleNames: 'applicant1MiddleName',
  applicant1LastNames: 'applicant1LastName',
  applicant1ConfirmFullName: 'applicant1ConfirmFullName',
  applicant2FirstNames: 'applicant2FirstName',
  applicant2MiddleNames: 'applicant2MiddleName',
  applicant2LastNames: 'applicant2LastName',
  applicant2ConfirmFullName: 'applicant2ConfirmFullName',
  applicant1FullNameOnCertificate: 'marriageApplicant1Name',
  applicant2FullNameOnCertificate: 'marriageApplicant2Name',
  applicant1ConfirmReceipt: 'applicant1ConfirmReceipt',
  applicant2ConfirmReceipt: 'applicant2ConfirmReceipt',
  applicant1LastNameChangedWhenMarried: 'applicant1LastNameChangedWhenMarried',
  applicant1NameDifferentToMarriageCertificate: 'applicant1NameDifferentToMarriageCertificate',
  applicant1WhyNameDifferent: 'applicant1WhyNameDifferent',
  applicant1WhyNameDifferentOtherDetails: 'applicant1WhyNameDifferentOtherDetails',
  applicant2WhyNameDifferent: 'applicant2WhyNameDifferent',
  applicant2WhyNameDifferentOtherDetails: 'applicant2WhyNameDifferentOtherDetails',
  applicant1NameChangedHow: 'applicant1NameChangedHow',
  applicant1NameChangedHowOtherDetails: 'applicant1NameChangedHowOtherDetails',
  applicant1LastNameChangedWhenMarriedMethod: 'applicant1LastNameChangedWhenMarriedMethod',
  applicant1LastNameChangedWhenMarriedOtherDetails: 'applicant1LastNameChangedWhenMarriedOtherDetails',
  applicant1NameDifferentToMarriageCertificateMethod: 'applicant1NameDifferentToMarriageCertificateMethod',
  applicant1NameDifferentToMarriageCertificateOtherDetails: 'applicant1NameDifferentToMarriageCertificateOtherDetails',
  applicant2LastNameChangedWhenMarried: 'applicant2LastNameChangedWhenMarried',
  applicant2NameDifferentToMarriageCertificate: 'applicant2NameDifferentToMarriageCertificate',
  applicant2NameChangedHow: 'applicant2NameChangedHow',
  applicant2NameChangedHowOtherDetails: 'applicant2NameChangedHowOtherDetails',
  applicant2LastNameChangedWhenMarriedMethod: 'applicant2LastNameChangedWhenMarriedMethod',
  applicant2LastNameChangedWhenMarriedOtherDetails: 'applicant2LastNameChangedWhenMarriedOtherDetails',
  applicant2NameDifferentToMarriageCertificateMethod: 'applicant2NameDifferentToMarriageCertificateMethod',
  applicant2NameDifferentToMarriageCertificateOtherDetails: 'applicant2NameDifferentToMarriageCertificateOtherDetails',
  applicant1Email: 'applicant1Email',
  applicant2Email: 'applicant2Email',
  applicant2EmailAddress: 'applicant2InviteEmailAddress',
  applicant2PhoneNumber: 'applicant2PhoneNumber',
  applicant1KnowsApplicant2Address: 'applicant1KnowsApplicant2Address',
  applicant1LegalProceedings: 'applicant1LegalProceedings',
  applicant1LegalProceedingsDetails: 'applicant1LegalProceedingsDetails',
  applicant2LegalProceedings: 'applicant2LegalProceedings',
  applicant2LegalProceedingsDetails: 'applicant2LegalProceedingsDetails',
  applicant2LegalProceedingsConcluded: 'applicant2LegalProceedingsConcluded',
  applicant1ApplyForFinancialOrder: 'applicant1FinancialOrder',
  applicant1WhoIsFinancialOrderFor: 'applicant1FinancialOrdersFor',
  applicant2ApplyForFinancialOrder: 'applicant2FinancialOrder',
  applicant2WhoIsFinancialOrderFor: 'applicant2FinancialOrdersFor',
  applicant1DocumentsUploaded: 'applicant1DocumentsUploaded',
  applicant2DocumentsUploaded: 'applicant2DocumentsUploaded',
  documentsGenerated: 'documentsGenerated',
  documentsUploaded: 'documentsUploaded',
  respondentUserId: 'applicant2UserId',
  applicant1UserId: 'applicant1UserId',
  applicant2Confirmation: 'applicant2ConfirmApplicant1Information',
  applicant2Explanation: 'applicant2ExplainsApplicant1IncorrectInformation',
  applicant1PcqId: 'applicant1PcqId',
  issueDate: 'issueDate',
  applicant1SolicitorAddress: 'applicant1SolicitorAddress',
  applicant1SolicitorRepresented: 'applicant1SolicitorRepresented',
  applicant1SolicitorAddressOverseas: 'applicant1SolicitorAddressOverseas',
  accessCode: 'accessCode',
  accessCodeApplicant1: 'accessCodeApplicant1',
  applicationFeeOrderSummary: 'applicationFeeOrderSummary',
  applicationFeeServiceRequestReference: 'applicationFeeServiceRequestReference',
  applicant2FinalOrderFeeOrderSummary: 'applicant2FinalOrderFeeOrderSummary',
  applicant2FinalOrderFeeServiceRequestReference: 'applicant2FinalOrderFeeServiceRequestReference',
  applicationPayments: 'applicationPayments',
  finalOrderPayments: 'finalOrderPayments',
  confirmDisputeApplication: 'confirmDisputeApplication',
  jurisdictionAgree: 'jurisdictionAgree',
  intendToDelay: 'intendToDelay',
  reasonCourtsOfEnglandAndWalesHaveNoJurisdiction: 'reasonCourtsOfEnglandAndWalesHaveNoJurisdiction',
  inWhichCountryIsYourLifeMainlyBased: 'inWhichCountryIsYourLifeMainlyBased',
  alternativeServiceOutcomes: 'alternativeServiceOutcomes',
  applicant1ApplyForConditionalOrderStarted: 'coApplicant1ApplyForConditionalOrderStarted',
  applicant2ApplyForConditionalOrderStarted: 'coApplicant2ApplyForConditionalOrderStarted',
  applicant1ApplyForConditionalOrder: 'coApplicant1ApplyForConditionalOrder',
  applicant2ApplyForConditionalOrder: 'coApplicant2ApplyForConditionalOrder',
  applicant1ConfirmInformationStillCorrect: 'coApplicant1ConfirmInformationStillCorrect',
  applicant1ReasonInformationNotCorrect: 'coApplicant1ReasonInformationNotCorrect',
  applicant2ConfirmInformationStillCorrect: 'coApplicant2ConfirmInformationStillCorrect',
  applicant2ReasonInformationNotCorrect: 'coApplicant2ReasonInformationNotCorrect',
  coCourt: 'coCourt',
  coCertificateOfEntitlementDocument: 'coCertificateOfEntitlementDocument',
  coConditionalOrderGrantedDocument: 'coConditionalOrderGrantedDocument',
  coDateAndTimeOfHearing: 'coDateAndTimeOfHearing',
  coDecisionDate: 'coDecisionDate',
  coGrantedDate: 'coGrantedDate',
  applicant1IsApplicant2Represented: 'applicant1IsApplicant2Represented',
  coRefusalClarificationReason: 'coRefusalClarificationReason',
  coRefusalClarificationAdditionalInfo: 'coRefusalClarificationAdditionalInfo',
  coClarificationUploadDocuments: 'coClarificationUploadDocuments',
  coLegalAdvisorDecisions: 'coLegalAdvisorDecisions',
  dateFinalOrderEligibleToRespondent: 'dateFinalOrderEligibleToRespondent',
  dateFinalOrderNoLongerEligible: 'dateFinalOrderNoLongerEligible',
  applicant2SolicitorName: 'applicant2SolicitorName',
  applicant2SolicitorEmail: 'applicant2SolicitorEmail',
  applicant2SolicitorFirmName: 'applicant2SolicitorFirmName',
  applicant1FinalOrderLateExplanation: 'applicant1FinalOrderLateExplanation',
  applicant2FinalOrderLateExplanation: 'applicant2FinalOrderLateExplanation',
  applicant2FinalOrderExplanation: 'applicant2FinalOrderExplanation',
  applicant1CannotUpload: 'applicant1CannotUpload',
  applicant2CannotUpload: 'applicant2CannotUpload',
  applicant2SolicitorRepresented: 'applicant2SolicitorRepresented',
  applicant1UsedWelshTranslationOnSubmission: 'applicant1UsedWelshTranslationOnSubmission',
  applicant2UsedWelshTranslationOnSubmission: 'applicant2UsedWelshTranslationOnSubmission',
  coRefusalRejectionAdditionalInfo: 'coRefusalRejectionAdditionalInfo',
  dueDate: 'dueDate',
  dateSubmitted: 'dateSubmitted',
  aosIsDrafted: 'aosIsDrafted',
  dateAosSubmitted: 'dateAosSubmitted',
  dateFinalOrderSubmitted: 'dateFinalOrderSubmitted',
  coApplicant1SubmittedDate: 'coApplicant1SubmittedDate',
  coApplicant2SubmittedDate: 'coApplicant2SubmittedDate',
  dateFinalOrderEligibleFrom: 'dateFinalOrderEligibleFrom',
  applicant1AppliedForFinalOrderFirst: 'applicant1AppliedForFinalOrderFirst',
  applicant2AppliedForFinalOrderFirst: 'applicant2AppliedForFinalOrderFirst',
  doesApplicant1IntendToSwitchToSole: 'doesApplicant1IntendToSwitchToSole',
  dateApplicant1DeclaredIntentionToSwitchToSoleFo: 'dateApplicant1DeclaredIntentionToSwitchToSoleFo',
  doesApplicant2IntendToSwitchToSole: 'doesApplicant2IntendToSwitchToSole',
  dateApplicant2DeclaredIntentionToSwitchToSoleFo: 'dateApplicant2DeclaredIntentionToSwitchToSoleFo',
  finalOrderSwitchedToSole: 'finalOrderSwitchedToSole',
  applicant1CanIntendToSwitchToSoleFo: 'applicant1CanIntendToSwitchToSoleFo',
  applicant2CanIntendToSwitchToSoleFo: 'applicant2CanIntendToSwitchToSoleFo',
  isFinalOrderOverdue: 'isFinalOrderOverdue',
  app1RfiDraftResponseDocs: 'app1RfiDraftResponseDocs',
  app2RfiDraftResponseDocs: 'app2RfiDraftResponseDocs',
  citizenPaymentCallbackUrl: 'citizenPaymentCallbackUrl',
  requestForInformationSoleParties: 'requestForInformationSoleParties',
  requestForInformationJointParties: 'requestForInformationJointParties',
  requestForInformationDetails: 'requestForInformationDetails',
  requestForInformationName: 'requestForInformationName',
  requestForInformationEmailAddress: 'requestForInformationEmailAddress',
  serviceMethod: 'serviceMethod',
  serviceApplicationAnswers: 'serviceApplicationAnswers',
  applicant1InterimApplicationType: 'applicant1InterimApplicationType',
  applicant1InterimAppsStatementOfTruth: 'applicant1InterimAppsStatementOfTruth',
  applicant1NoResponseOwnSearches: 'applicant1NoResponseOwnSearches',
  applicant1NoResponseRespondentAddressInEnglandWales: 'applicant1NoResponseRespondentAddressInEnglandWales',
  applicant1NoResponsePartnerInUkOrReceivingBenefits: 'applicant1NoResponsePartnerInUkOrReceivingBenefits',
  applicant1NoResponseSearchOrDispense: 'applicant1NoResponseSearchOrDispense',
  applicant1NoResponseNoNewAddressDetails: 'applicant1NoResponseNoNewAddressDetails',
  applicant1NoResponseProcessServerOrBailiff: 'applicant1NoResponseProcessServerOrBailiff',
  applicant1NoResponseCheckContactDetails: 'applicant1NoResponseCheckContactDetails',
  applicant1NoResponsePartnerNewEmailOrAddress: 'applicant1NoResponsePartnerNewEmailOrAddress',
  applicant1NoResponseProvidePartnerNewEmailOrAlternativeService:
    'applicant1NoResponseProvidePartnerNewEmailOrAlternativeService',
  applicant1NoResponsePartnerEmailAddress: 'applicant1NoResponsePartnerEmailAddress',
  applicant1NoResponseSendPapersAgainOrTrySomethingElse: 'applicant1NoResponseSendPapersAgainOrTrySomethingElse',
  applicant1NoResponsePartnerHasReceivedPapers: 'applicant1NoResponsePartnerHasReceivedPapers',
  applicant1InterimAppsIUnderstand: 'applicant1InterimAppsIUnderstand',
  applicant1InterimAppsUseHelpWithFees: 'applicant1InterimAppsUseHelpWithFees',
  applicant1InterimAppsHaveHwfReference: 'applicant1InterimAppsHaveHwfReference',
  applicant1InterimAppsCanUploadEvidence: 'applicant1InterimAppsCanUploadEvidence',
  applicant1InterimAppsHwfRefNumber: 'applicant1InterimAppsHwfRefNumber',
  applicant1InterimAppsEvidenceDocs: 'applicant1InterimAppsEvidenceDocs',
  applicant1InterimAppsCannotUploadDocs: 'applicant1InterimAppsCannotUploadDocs',
  applicant1DeemedEvidenceDetails: 'applicant1DeemedEvidenceDetails',
  applicant1DeemedNoEvidenceStatement: 'applicant1DeemedNoEvidenceStatement',
  applicant1BailiffPartnersName: 'applicant1BailiffPartnersName',
  applicant1BailiffPartnerInARefuge: 'applicant1BailiffPartnerInARefuge',
  applicant1BailiffKnowPartnersPhone: 'applicant1BailiffKnowPartnersPhone',
  applicant1BailiffPartnersPhone: 'applicant1BailiffPartnersPhone',
  applicant1BailiffKnowPartnersDateOfBirth: 'applicant1BailiffKnowPartnersDateOfBirth',
  applicant1BailiffPartnersDateOfBirth: 'applicant1BailiffPartnersDateOfBirth',
  applicant1BailiffPartnersApproximateAge: 'applicant1BailiffPartnersApproximateAge',
  applicant1BailiffPartnersHeight: 'applicant1BailiffPartnersHeight',
  applicant1BailiffPartnersHairColour: 'applicant1BailiffPartnersHairColour',
  applicant1BailiffPartnersEyeColour: 'applicant1BailiffPartnersEyeColour',
  applicant1BailiffPartnersEthnicGroup: 'applicant1BailiffPartnersEthnicGroup',
  applicant1BailiffPartnersDistinguishingFeatures: 'applicant1BailiffPartnersDistinguishingFeatures',
  applicant1BailiffBestTimeToServe: 'applicant1BailiffBestTimeToServe',
  applicant1BailiffDoesPartnerHaveVehicle: 'applicant1BailiffDoesPartnerHaveVehicle',
  applicant1BailiffPartnerVehicleModel: 'applicant1BailiffPartnerVehicleModel',
  applicant1BailiffPartnerVehicleColour: 'applicant1BailiffPartnerVehicleColour',
  applicant1BailiffPartnerVehicleRegistration: 'applicant1BailiffPartnerVehicleRegistration',
  applicant1BailiffPartnerVehicleOtherDetails: 'applicant1BailiffPartnerVehicleOtherDetails',
  applicant1BailiffHasPartnerBeenViolent: 'applicant1BailiffHasPartnerBeenViolent',
  applicant1BailiffPartnerViolenceDetails: 'applicant1BailiffPartnerViolenceDetails',
  applicant1BailiffHasPartnerMadeThreats: 'applicant1BailiffHasPartnerMadeThreats',
  applicant1BailiffPartnerThreatsDetails: 'applicant1BailiffPartnerThreatsDetails',
  applicant1BailiffHavePoliceBeenInvolved: 'applicant1BailiffHavePoliceBeenInvolved',
  applicant1BailiffPoliceInvolvedDetails: 'applicant1BailiffPoliceInvolvedDetails',
  applicant1BailiffHaveSocialServicesBeenInvolved: 'applicant1BailiffHaveSocialServicesBeenInvolved',
  applicant1BailiffSocialServicesInvolvedDetails: 'applicant1BailiffSocialServicesInvolvedDetails',
  applicant1BailiffAreThereDangerousAnimals: 'applicant1BailiffAreThereDangerousAnimals',
  applicant1BailiffDangerousAnimalsDetails: 'applicant1BailiffDangerousAnimalsDetails',
  applicant1BailiffDoesPartnerHaveMentalIssues: 'applicant1BailiffDoesPartnerHaveMentalIssues',
  applicant1BailiffPartnerMentalIssuesDetails: 'applicant1BailiffPartnerMentalIssuesDetails',
  applicant1BailiffDoesPartnerHoldFirearmsLicense: 'applicant1BailiffDoesPartnerHoldFirearmsLicense',
  applicant1BailiffPartnerFirearmsLicenseDetails: 'applicant1BailiffPartnerFirearmsLicenseDetails',
  applicant1AltServiceReasonForApplying: 'applicant1AltServiceReasonForApplying',
  applicant1AltServiceMethod: 'applicant1AltServiceMethod',
  applicant1AltServicePartnerEmail: 'applicant1AltServicePartnerEmail',
  applicant1AltServicePartnerEmailWhenDifferent: 'applicant1AltServicePartnerEmail',
  applicant1AltServicePartnerPhone: 'applicant1AltServicePartnerPhone',
  applicant1AltServicePartnerWANum: 'applicant1AltServicePartnerWANum',
  applicant1AltServicePartnerSocialDetails: 'applicant1AltServicePartnerSocialDetails',
  applicant1AltServicePartnerOtherDetails: 'applicant1AltServicePartnerOtherDetails',
  applicant1AltServiceMethodJustification: 'applicant1AltServiceMethodJustification',
  applicant1AltServiceDifferentWays: 'applicant1AltServiceDifferentWays',
  servicePaymentFeePaymentMethod: 'servicePaymentFeePaymentMethod',
  servicePaymentFeeDateOfPayment: 'servicePaymentFeeDateOfPayment',
  servicePaymentFeeOrderSummary: 'servicePaymentFeeOrderSummary',
  servicePaymentFeeServiceRequestReference: 'servicePaymentFeeServiceRequestReference',
  servicePaymentFeeHelpWithFeesReferenceNumber: 'servicePaymentFeeHelpWithFeesReferenceNumber',
  serviceApplicationDocsUploadedPreSubmission: 'serviceApplicationDocsUploadedPreSubmission',
  servicePayments: 'servicePayments',
  receivedServiceApplicationDate: 'receivedServiceApplicationDate',
  receivedServiceAddedDate: 'receivedServiceAddedDate',
  serviceApplicationSubmittedOnline: 'serviceApplicationSubmittedOnline',
  alternativeServiceFeeRequired: 'alternativeServiceFeeRequired',
  alternativeServiceType: 'alternativeServiceType',
  applicant2LegalProceedingDocs: 'applicant2LegalProceedingDocs',
  applicant1SearchGovRecordsWhichDepartments: 'applicant1SearchGovRecordsWhichDepartments',
  applicant1SearchGovRecordsWhyTheseDepartments: 'applicant1SearchGovRecordsWhyTheseDepartments',
  applicant1SearchGovRecordsOtherDepartmentNames: 'applicant1SearchGovRecordsOtherDepartmentNames',
  applicant1SearchGovRecordsPartnerName: 'applicant1SearchGovRecordsPartnerName',
  applicant1SearchGovRecordsReasonForApplying: 'applicant1SearchGovRecordsReasonForApplying',
  applicant1SearchGovRecordsPartnerNationalInsurance: 'applicant1SearchGovRecordsPartnerNationalInsurance',
  applicant1SearchGovRecordsKnowPartnerDateOfBirth: 'applicant1SearchGovRecordsKnowPartnerDateOfBirth',
  applicant1SearchGovRecordsPartnerApproximateAge: 'applicant1SearchGovRecordsPartnerApproximateAge',
  applicant1SearchGovRecordsPartnerDateOfBirth: 'applicant1SearchGovRecordsPartnerDateOfBirth',
  applicant1SearchGovRecordsKnowPartnerNationalInsurance: 'applicant1SearchGovRecordsKnowPartnerNationalInsurance',
  applicant1SearchGovRecordsPartnerLastKnownAddress: 'applicant1SearchGovRecordsPartnerLastKnownAddress',
  applicant1SearchGovRecordsPartnerLastKnownAddressDates: 'applicant1SearchGovRecordsPartnerLastKnownAddressDates',
  applicant1SearchGovRecordsKnowPartnerAdditionalAddresses: 'applicant1SearchGovRecordsKnowPartnerAdditionalAddresses',
  applicant1SearchGovRecordsPartnerAdditionalAddress1: 'applicant1SearchGovRecordsPartnerAdditionalAddress1',
  applicant1SearchGovRecordsPartnerAdditionalAddressDates1: 'applicant1SearchGovRecordsPartnerAdditionalAddressDates1',
  applicant1SearchGovRecordsPartnerAdditionalAddress2: 'applicant1SearchGovRecordsPartnerAdditionalAddress2',
  applicant1SearchGovRecordsPartnerAdditionalAddressDates2: 'applicant1SearchGovRecordsPartnerAdditionalAddressDates2',
  generalApplications: 'generalApplications',
  applicant1GeneralAppServiceRequest: 'applicant1GeneralAppServiceRequest',
  applicant2GeneralAppServiceRequest: 'applicant2GeneralAppServiceRequest',
  applicant1GeneralAppPayments: 'applicant1GeneralAppPayments',
  applicant2GeneralAppPayments: 'applicant2GeneralAppPayments',
  applicant1DispenseLiveTogether: 'applicant1DispenseLiveTogether',
  applicant1DispenseLivedTogetherDate: 'applicant1DispenseLivedTogetherDate',
  applicant1DispenseAwarePartnerLived: 'applicant1DispenseAwarePartnerLived',
  applicant1DispensePartnerPastAddress1: 'applicant1DispensePartnerPastAddress1',
  applicant1DispensePartnerPastAddressEnquiries1: 'applicant1DispensePartnerPastAddressEnquiries1',
  applicant1DispensePartnerPastAddress2: 'applicant1DispensePartnerPastAddress2',
  applicant1DispensePartnerPastAddressEnquiries2: 'applicant1DispensePartnerPastAddressEnquiries2',
  applicant1DispensePartnerLastSeenDate: 'applicant1DispensePartnerLastSeenDate',
  applicant1DispensePartnerLastSeenOver2YearsAgo: 'applicant1DispensePartnerLastSeenOver2YearsAgo',
  applicant1DispensePartnerLastSeenDescription: 'applicant1DispensePartnerLastSeenDescription',
  applicant1DispenseHavePartnerEmailAddresses: 'applicant1DispenseHavePartnerEmailAddresses',
  applicant1DispenseHaveSearchedFinalOrder: 'applicant1DispenseHaveSearchedFinalOrder',
  applicant1DispenseWhyNoFinalOrderSearch: 'applicant1DispenseWhyNoFinalOrderSearch',
  applicant1DispensePartnerEmailAddresses: 'applicant1DispensePartnerEmailAddresses',
  applicant1DispenseHavePartnerPhoneNumbers: 'applicant1DispenseHavePartnerPhoneNumbers',
  applicant1DispensePartnerPhoneNumbers: 'applicant1DispensePartnerPhoneNumbers',
  applicant1DispenseTriedTracingAgent: 'applicant1DispenseTriedTracingAgent',
  applicant1DispenseWhyNoTracingAgent: 'applicant1DispenseWhyNoTracingAgent',
  applicant1DispenseTracingAgentResults: 'applicant1DispenseTracingAgentResults',
  applicant1DispenseTriedTracingOnline: 'applicant1DispenseTriedTracingOnline',
  applicant1DispenseWhyNoTracingOnline: 'applicant1DispenseWhyNoTracingOnline',
  applicant1DispenseTracingOnlineResults: 'applicant1DispenseTracingOnlineResults',
  applicant1DispenseTriedSearchingOnline: 'applicant1DispenseTriedSearchingOnline',
  applicant1DispenseWhyNoSearchingOnline: 'applicant1DispenseWhyNoSearchingOnline',
  applicant1DispenseSearchingOnlineResults: 'applicant1DispenseSearchingOnlineResults',
  applicant1DispenseTriedContactingEmployer: 'applicant1DispenseTriedContactingEmployer',
  applicant1DispenseWhyNoContactingEmployer: 'applicant1DispenseWhyNoContactingEmployer',
  applicant1DispenseEmployerName: 'applicant1DispenseEmployerName',
  applicant1DispenseEmployerAddress: 'applicant1DispenseEmployerAddress',
  applicant1DispensePartnerOccupation: 'applicant1DispensePartnerOccupation',
  applicant1DispenseContactingEmployerResults: 'applicant1DispenseContactingEmployerResults',
  applicant1DispenseChildrenOfFamily: 'applicant1DispenseChildrenOfFamily',
  applicant1DispensePartnerContactWithChildren: 'applicant1DispensePartnerContactWithChildren',
  applicant1DispenseHowPartnerContactChildren: 'applicant1DispenseHowPartnerContactChildren',
  applicant1DispensePartnerLastContactChildren: 'applicant1DispensePartnerLastContactChildren',
  applicant1DispenseChildMaintenanceOrder: 'applicant1DispenseChildMaintenanceOrder',
  applicant1DispenseChildMaintenanceResults: 'applicant1DispenseChildMaintenanceResults',
  applicant1DispenseContactFriendsOrRelativesDetails: 'applicant1DispenseContactFriendsOrRelativesDetails',
  applicant1DispenseOtherEnquiries: 'applicant1DispenseOtherEnquiries',
};

// export function formatCase<OutputFormat>(fields: FieldFormats, data: Partial<Case> | CaseData): OutputFormat {
//   const result = {};

//   for (const field of Object.keys(data)) {
//     const value = fields[field];

//     if (typeof value === 'function') {
//       Object.assign(result, value(data));
//     } else if (typeof fields[field] === 'string') {
//       result[value] = data[field];
//     }
//   }

//   return result as OutputFormat;
// }


export function formatCase<OutputFormat>(fields: FieldFormats, data: Partial<Case> | CaseData): OutputFormat {
  const result = {} as OutputFormat;
  for (const field of Object.keys(data)) {
    const typedField = field as keyof typeof data;

    const value = fields[field];
    // if (!value) continue;
    if (typeof value === 'string') {
      (result as any)[value] = data[typedField];
    }
  }

  return result;
}


// export type FieldFormats = Record<string, string | ((AnyObject) => AnyObject)>;
export type FieldFormats = Record<string, string | ((value: AnyObject) => AnyObject)>;

export interface Case {
  applicationType?: ApplicationType;
  divorceOrDissolution: DivorceOrDissolution;
  issueDate?: DateAsString;
  applicant1SolicitorAddress?: string;
  applicant1SolicitorAddressOverseas?: YesOrNo;
  applicant2SolicitorAddress?: string;
  applicant2SolicitorAddressOverseas?: YesOrNo;
  gender?: Gender;
  sameSex?: Checkbox;
  applicant1ScreenHasUnionBroken?: YesOrNo;
  applicant2ScreenHasUnionBroken?: YesOrNo;
  relationshipDate?: CaseDate;
  hasCertificate?: YesOrNo;
  applicant1HelpPayingNeeded?: YesOrNo;
  applicant1AlreadyAppliedForHelpPaying?: YesOrNo;
  applicant1HelpWithFeesRefNo?: string;
  applicant2HelpPayingNeeded?: YesOrNo;
  applicant2AlreadyAppliedForHelpPaying?: YesOrNo;
  applicant2HelpWithFeesRefNo?: string;
  applicant2FoHelpPayingNeeded?: YesOrNo;
  applicant2FoAlreadyAppliedForHelpPaying?: YesOrNo;
  applicant2FoHelpWithFeesRefNo?: string;
  inTheUk?: YesOrNo;
  certificateInEnglish?: YesOrNo;
  certifiedTranslation?: YesOrNo;
  ceremonyCountry?: string;
  ceremonyPlace?: string;
  applicant1LifeBasedInEnglandAndWales?: YesOrNo;
  applicant2LifeBasedInEnglandAndWales?: YesOrNo;
  applicant1DomicileInEnglandWales?: YesOrNo;
  applicant2DomicileInEnglandWales?: YesOrNo;
  bothLastHabituallyResident?: YesOrNo;
  applicant1LivingInEnglandWalesTwelveMonths?: YesOrNo;
  applicant1LivingInEnglandWalesSixMonths?: YesOrNo;
  jurisdictionResidualEligible?: YesOrNo;
  applicant1EnglishOrWelsh?: LanguagePreference;
  applicant2EnglishOrWelsh?: LanguagePreference;
  applicant1FirstNames?: string;
  applicant1MiddleNames?: string;
  applicant1LastNames?: string;
  applicant1ConfirmFullName?: YesOrNo | null;
  applicant1Address1?: string;
  applicant1Address2?: string;
  applicant1Address3?: string;
  applicant1AddressTown?: string;
  applicant1AddressCounty?: string;
  applicant1AddressPostcode?: string;
  applicant1AddressCountry?: string;
  applicant1AddressOverseas?: YesOrNo;
  applicant1PhoneNumber?: string;
  applicant1AgreeToReceiveEmails?: Checkbox;
  applicant1ConfirmReceipt: YesOrNo;
  applicant2PhoneNumber?: string;
  applicant2AgreeToReceiveEmails?: Checkbox;
  applicant2ConfirmReceipt: YesOrNo;
  applicant1ApplyForConditionalOrderStarted: YesOrNo;
  applicant2ApplyForConditionalOrderStarted: YesOrNo;
  connections: JurisdictionConnections[];
  applicant1FullNameOnCertificate?: string;
  applicant2FullNameOnCertificate?: string;
  applicant1AddressPrivate: YesOrNo;
  applicant1InRefuge?: YesOrNo;
  applicant2FirstNames?: string;
  applicant2MiddleNames?: string;
  applicant2LastNames?: string;
  applicant2ConfirmFullName?: YesOrNo | null;
  applicant2AddressPrivate: YesOrNo;
  applicant2InRefuge?: YesOrNo;
  applicant2Address1?: string;
  applicant2Address2?: string;
  applicant2Address3?: string;
  applicant2AddressTown?: string;
  applicant2AddressCounty?: string;
  applicant2AddressPostcode?: string;
  applicant2AddressCountry?: string;
  applicant2AddressOverseas?: YesOrNo;
  applicant1LastNameChangedWhenMarried?: YesOrNo;
  applicant1LastNameChangedWhenMarriedMethod?: ChangedNameHow[];
  applicant1LastNameChangedWhenMarriedOtherDetails?: string;
  applicant1NameDifferentToMarriageCertificate?: YesOrNo | null;
  applicant1WhyNameDifferent: ChangedNameWhy[];
  applicant1WhyNameDifferentOtherDetails: string;
  applicant2NameDifferentToMarriageCertificate?: YesOrNo | null;
  applicant2WhyNameDifferent: ChangedNameWhy[];
  applicant2WhyNameDifferentOtherDetails: string;
  applicant1NameDifferentToMarriageCertificateMethod?: ChangedNameHow[];
  applicant1NameDifferentToMarriageCertificateOtherDetails?: string;
  applicant1NameChangedHow?: ChangedNameHow[];
  applicant1NameChangedHowOtherDetails?: string;
  applicant2LastNameChangedWhenMarried?: YesOrNo;
  applicant2LastNameChangedWhenMarriedMethod?: ChangedNameHow[];
  applicant2LastNameChangedWhenMarriedOtherDetails?: string;
  applicant2NameDifferentToMarriageCertificateMethod?: ChangedNameHow[];
  applicant2NameDifferentToMarriageCertificateOtherDetails?: string;
  applicant2NameChangedHow?: ChangedNameHow[];
  applicant2NameChangedHowOtherDetails?: string;
  applicant1Email?: string;
  applicant2Email?: string;
  applicant2EmailAddress?: string;
  applicant1DoesNotKnowApplicant2EmailAddress?: Checkbox;
  applicant1KnowsApplicant2Address?: YesOrNo;
  iWantToHavePapersServedAnotherWay?: Checkbox;
  applicant1LegalProceedings?: YesOrNo;
  applicant1LegalProceedingsDetails?: string;
  applicant2LegalProceedings?: YesOrNo;
  applicant2LegalProceedingsDetails?: string;
  applicant2LegalProceedingsConcluded?: YesOrNo;
  applicant2UnableToUploadEvidence?: Checkbox;
  applicant1ApplyForFinancialOrder?: YesOrNo;
  applicant1WhoIsFinancialOrderFor?: FinancialOrderFor[];
  applicant2ApplyForFinancialOrder?: YesOrNo;
  applicant2WhoIsFinancialOrderFor?: FinancialOrderFor[];
  applicant1UploadedFiles?: UploadedFile[];
  applicant2UploadedFiles?: UploadedFile[];
  documentsGenerated: ListValue<DivorceDocument>[];
  documentsUploaded: ListValue<DivorceDocument>[];
  applicant1DocumentsUploaded?: ListValue<Partial<DivorceDocument> | null>[];
  applicant2DocumentsUploaded?: ListValue<Partial<DivorceDocument> | null>[];
  applicant1CannotUpload?: Checkbox;
  applicant2CannotUpload?: Checkbox;
  applicant1CannotUploadDocuments?: DocumentType | DocumentType[];
  applicant2CannotUploadDocuments?: DocumentType | DocumentType[];
  accessCode?: string;
  accessCodeApplicant1?: string;
  dueDate?: DateAsString;
  applicant1IConfirmPrayer?: Checkbox;
  applicant2IConfirmPrayer?: Checkbox;
  applicant1StatementOfTruth?: Checkbox;
  applicant2StatementOfTruth?: Checkbox;
  caseReference?: string;
  respondentUserId?: string;
  applicant1UserId?: string;
  dateSubmitted?: DateAsString;
  applicationPayments: ListValue<Payment>[];
  finalOrderPayments: ListValue<Payment>[];
  applicationFeeOrderSummary: OrderSummary;
  applicationFeeServiceRequestReference: string;
  applicant2FinalOrderFeeOrderSummary: OrderSummary;
  applicant2FinalOrderFeeServiceRequestReference: string;
  applicant2Confirmation: YesOrNo;
  applicant2Explanation: string;
  applicant1PcqId?: string;
  disputeApplication?: YesOrNo | null;
  confirmDisputeApplication?: YesOrNo;
  confirmReadPetition?: Checkbox;
  jurisdictionAgree?: YesOrNo;
  intendToDelay?: YesOrNo;
  reasonCourtsOfEnglandAndWalesHaveNoJurisdiction?: string;
  inWhichCountryIsYourLifeMainlyBased?: string;
  alternativeServiceOutcomes: ListValue<AlternativeServiceOutcome>[];
  applicant1ApplyForConditionalOrder?: YesOrNo;
  applicant2ApplyForConditionalOrder?: YesOrNo;
  applicant1ConfirmInformationStillCorrect?: YesOrNo;
  applicant1ReasonInformationNotCorrect?: string;
  applicant2ConfirmInformationStillCorrect?: YesOrNo;
  applicant2ReasonInformationNotCorrect?: string;
  coApplicant1StatementOfTruth?: Checkbox;
  coApplicant2StatementOfTruth?: Checkbox;
  coCourt: ConditionalOrderCourt;
  dateFinalOrderEligibleFrom: DateAsString;
  coCertificateOfEntitlementDocument: DivorceDocument;
  coConditionalOrderGrantedDocument: DivorceDocument;
  coApplicant1SubmittedDate?: DateAsString;
  coApplicant2SubmittedDate?: DateAsString;
  coRefusalRejectionAdditionalInfo?: string;
  coDateAndTimeOfHearing: DateAsString;
  coDecisionDate: DateAsString;
  coGrantedDate: DateAsString;
  applicant1IsApplicant2Represented: Applicant2Represented;
  coRefusalClarificationReason?: ClarificationReason[];
  coRefusalClarificationAdditionalInfo?: string;
  dateFinalOrderEligibleToRespondent?: DateAsString;
  coClarificationResponses?: string;
  coClarificationResponsesSubmitted?: ListValue<ClarificationResponse>[];
  coCannotUploadClarificationDocuments?: Checkbox;
  coClarificationUploadDocuments?: ListValue<Partial<DivorceDocument> | null>[];
  coClarificationUploadedFiles?: UploadedFile[];
  coLegalAdvisorDecisions?: ListValue<LegalAdvisorDecision>[];
  doesApplicant1WantToApplyForFinalOrder?: Checkbox;
  doesApplicant2WantToApplyForFinalOrder?: Checkbox;
  applicant2FinalOrderExplanation?: string;
  dateFinalOrderNoLongerEligible?: DateAsString;
  applicant2SolicitorName: string;
  applicant2SolicitorEmail: string;
  applicant2SolicitorFirmName: string;
  applicant2SolicitorAddress1?: string;
  applicant2SolicitorAddress2?: string;
  applicant2SolicitorAddress3?: string;
  applicant2SolicitorAddressTown?: string;
  applicant2SolicitorAddressCounty?: string;
  applicant2SolicitorAddressPostcode?: string;
  applicant2SolicitorAddressCountry?: string;
  applicant1FinalOrderLateExplanation?: string;
  applicant2FinalOrderLateExplanation?: string;
  applicant1FinalOrderStatementOfTruth?: Checkbox;
  applicant2FinalOrderStatementOfTruth?: Checkbox;
  applicant2SolicitorRepresented: YesOrNo;
  applicant1SolicitorRepresented: YesOrNo;
  dateFinalOrderSubmitted?: DateAsString;
  applicant1IntendsToSwitchToSole?: Checkbox;
  applicant2IntendsToSwitchToSole?: Checkbox;
  dateAosSubmitted?: DateAsString;
  aosIsDrafted?: YesOrNo;
  aosStatementOfTruth: Checkbox;
  previousState: State;
  applicant1UsedWelshTranslationOnSubmission?: YesOrNo;
  applicant2UsedWelshTranslationOnSubmission?: YesOrNo;
  applicant2Offline: YesOrNo;
  applicant1AppliedForFinalOrderFirst: YesOrNo;
  applicant2AppliedForFinalOrderFirst: YesOrNo;
  switchedToSoleCo: YesOrNo;
  coIsAdminClarificationSubmitted: YesOrNo;
  doesApplicant1IntendToSwitchToSole: YesOrNo;
  dateApplicant1DeclaredIntentionToSwitchToSoleFo: DateAsString;
  doesApplicant2IntendToSwitchToSole: YesOrNo;
  dateApplicant2DeclaredIntentionToSwitchToSoleFo: DateAsString;
  finalOrderSwitchedToSole: YesOrNo;
  applicant1CanIntendToSwitchToSoleFo: YesOrNo;
  applicant2CanIntendToSwitchToSoleFo: YesOrNo;
  isFinalOrderOverdue: YesOrNo;
  requestsForInformation?: ListValue<Partial<RequestForInformation> | null>[];
  requestForInformation?: RequestForInformation;
  requestForInformationSoleParties?: string;
  requestForInformationJointParties?: string;
  requestForInformationDetails?: string;
  requestForInformationName?: string;
  requestForInformationEmailAddress?: string;
  app1RfiDraftResponseDocs?: ListValue<Partial<DivorceDocument> | null>[];
  app1RfiDraftResponseUploadedFiles?: UploadedFile[];
  app1RfiDraftResponseCannotUploadDocs?: Checkbox;
  app1RfiDraftResponseDetails?: string;
  app2RfiDraftResponseDocs?: ListValue<Partial<DivorceDocument> | null>[];
  app2RfiDraftResponseUploadedFiles?: UploadedFile[];
  app2RfiDraftResponseCannotUploadDocs?: Checkbox;
  app2RfiDraftResponseDetails?: string;
  citizenPaymentCallbackUrl: string;
  serviceMethod: ServiceMethod;
  applicant1NoResponseCheckContactDetails?: NoResponseCheckContactDetails;
  applicant1NoResponsePartnerNewEmailOrAddress?: NoResponsePartnerNewEmailOrAddress;
  applicant1NoResponseProvidePartnerNewEmailOrAlternativeService?: NoResponseProvidePartnerNewEmailOrAlternativeService;
  applicant1NoResponsePartnerHasReceivedPapers?: YesOrNo;
  applicant1NoResponseSendPapersAgainOrTrySomethingElse?: NoResponseSendPapersAgainOrTrySomethingElse;
  applicant1NoResponseNoNewAddressDetails?: NoResponseNoNewAddressDetails;
  applicant1NoResponseProcessServerOrBailiff?: NoResponseProcessServerOrBailiff;
  applicant1InterimAppsIUnderstand?: Checkbox;
  applicant1InterimAppsUseHelpWithFees?: YesOrNo;
  applicant1InterimAppsHaveHwfReference?: YesOrNo;
  applicant1InterimAppsCanUploadEvidence?: YesOrNo;
  applicant1InterimAppsHwfRefNumber?: string;
  applicant1InterimAppsEvidenceUploadedFiles?: UploadedFile[];
  applicant1InterimAppsEvidenceDocs?: ListValue<Partial<DivorceDocument> | null>[];
  applicant1InterimAppsCannotUploadDocs?: Checkbox;
  applicant1DeemedEvidenceDetails?: string;
  applicant1DeemedNoEvidenceStatement?: string;
  applicant1BailiffPartnerInARefuge: YesOrNoOrNotKnown;
  applicant1BailiffPartnersName?: string;
  applicant1BailiffKnowPartnersPhone: YesOrNo;
  applicant1BailiffPartnersPhone?: string;
  applicant1BailiffKnowPartnersDateOfBirth: YesOrNo;
  applicant1BailiffPartnersDateOfBirth: CaseDate | DateAsString;
  applicant1BailiffPartnersApproximateAge: number;
  applicant1BailiffPartnersHeight: number;
  applicant1BailiffPartnersHairColour: string;
  applicant1BailiffPartnersEyeColour: string;
  applicant1BailiffPartnersEthnicGroup: string;
  applicant1BailiffPartnersDistinguishingFeatures: string;
  applicant1BailiffBestTimeToServe: string;
  applicant1BailiffDoesPartnerHaveVehicle: YesOrNoOrNotKnown;
  applicant1BailiffPartnerVehicleModel: string;
  applicant1BailiffPartnerVehicleColour: string;
  applicant1BailiffPartnerVehicleRegistration: string;
  applicant1BailiffPartnerVehicleOtherDetails: string;
  applicant1BailiffHasPartnerBeenViolent: YesOrNoOrNotKnown;
  applicant1BailiffPartnerViolenceDetails: string;
  applicant1BailiffHasPartnerMadeThreats: YesOrNoOrNotKnown;
  applicant1BailiffPartnerThreatsDetails: string;
  applicant1BailiffHavePoliceBeenInvolved: YesOrNoOrNotKnown;
  applicant1BailiffPoliceInvolvedDetails: string;
  applicant1BailiffHaveSocialServicesBeenInvolved: YesOrNoOrNotKnown;
  applicant1BailiffSocialServicesInvolvedDetails: string;
  applicant1BailiffAreThereDangerousAnimals: YesOrNoOrNotKnown;
  applicant1BailiffDangerousAnimalsDetails: string;
  applicant1BailiffDoesPartnerHaveMentalIssues: YesOrNoOrNotKnown;
  applicant1BailiffPartnerMentalIssuesDetails: string;
  applicant1BailiffDoesPartnerHoldFirearmsLicense: YesOrNoOrNotKnown;
  applicant1BailiffPartnerFirearmsLicenseDetails: string;
  applicant1InterimApplicationType?: InterimApplicationType;
  applicant2InterimApplicationType?: InterimApplicationType;
  applicant1InterimAppsStatementOfTruth?: Checkbox;
  applicant1NoResponseOwnSearches?: NoResponseOwnSearches;
  applicant1NoResponseRespondentAddressInEnglandWales?: Checkbox;
  applicant1NoResponsePartnerInUkOrReceivingBenefits?: YesOrNo;
  applicant1NoResponseSearchOrDispense?: NoResponseSearchOrDispense;
  applicant1NoResponsePartnerAddress?: AddressGlobalUK;
  applicant1NoResponsePartnerAddress1?: string;
  applicant1NoResponsePartnerAddress2?: string;
  applicant1NoResponsePartnerAddress3?: string;
  applicant1NoResponsePartnerAddressTown?: string;
  applicant1NoResponsePartnerAddressCounty?: string;
  applicant1NoResponsePartnerAddressCountry?: string;
  applicant1NoResponsePartnerAddressPostcode?: string;
  applicant1NoResponsePartnerAddressOverseas?: YesOrNo;
  applicant1NoResponsePartnerEmailAddress?: string;
  applicant2Address?: AddressGlobalUK;
  servicePaymentFeeOrderSummary: OrderSummary;
  servicePaymentFeeServiceRequestReference: string;
  servicePaymentFeeHelpWithFeesReferenceNumber: string;
  serviceApplicationDocsUploadedPreSubmission: YesOrNo;
  servicePayments: ListValue<Payment>[];
  receivedServiceApplicationDate: DateAsString;
  receivedServiceAddedDate: DateAsString;
  serviceApplicationSubmittedOnline: YesOrNo;
  alternativeServiceFeeRequired: YesOrNo;
  alternativeServiceType: AlternativeServiceType;
  serviceApplicationAnswers: DivorceDocument;
  applicant1AltServiceReasonForApplying?: string;
  applicant1AltServiceMethod?: AlternativeServiceMethod;
  applicant1AltServicePartnerEmail?: string;
  applicant1AltServicePartnerEmailWhenDifferent?: string;
  applicant1AltServicePartnerPhone?: string;
  applicant1AltServicePartnerWANum?: string;
  applicant1AltServicePartnerSocialDetails?: string;
  applicant1AltServicePartnerOtherDetails?: string;
  applicant1AltServiceMethodJustification?: string;
  applicant1AltServiceDifferentWays?: AlternativeServiceDifferentWays[];
  servicePaymentFeeDateOfPayment: DateAsString;
  servicePaymentFeePaymentMethod: ServicePaymentMethod;
  applicant2LegalProceedingDocs?: ListValue<Partial<DivorceDocument> | null>[];
  applicant2LegalProceedingUploadedFiles?: UploadedFile[];
  applicant1SearchGovRecordsReasonForApplying: string;
  applicant1SearchGovRecordsWhichDepartments: SearchGovRecordsWhichDepartment[];
  applicant1SearchGovRecordsWhyTheseDepartments: string;
  applicant1SearchGovRecordsOtherDepartmentNames?: string;
  applicant1SearchGovRecordsPartnerName: string;
  applicant1SearchGovRecordsPartnerNationalInsurance?: string;
  applicant1SearchGovRecordsPartnerDateOfBirth?: CaseDate | DateAsString;
  applicant1SearchGovRecordsKnowPartnerDateOfBirth: YesOrNo;
  applicant1SearchGovRecordsPartnerApproximateAge?: string;
  applicant1SearchGovRecordsKnowPartnerNationalInsurance: YesOrNo;
  applicant1SearchGovRecordsPartnerLastKnownAddress: AddressGlobalUK;
  applicant1SearchGovRecordsPartnerLastKnownAddressDates: string;
  applicant1SearchGovRecordsKnowPartnerAdditionalAddresses: YesOrNo;
  applicant1SearchGovRecordsPartnerAdditionalAddress1: string;
  applicant1SearchGovRecordsPartnerAdditionalAddressDates1: string;
  applicant1SearchGovRecordsPartnerAdditionalAddress2?: string;
  applicant1SearchGovRecordsPartnerAdditionalAddressDates2?: string;
  generalApplications?: ListValue<GeneralApplication>[];
  applicant1GeneralAppServiceRequest?: string;
  applicant2GeneralAppServiceRequest?: string;
  applicant1GeneralAppPayments?: ListValue<Payment>[];
  applicant2GeneralAppPayments?: ListValue<Payment>[];
  applicant1DispensePartnerLastSeenOver2YearsAgo?: YesOrNo;
  applicant1DispensePartnerLastSeenOrHeardOfDate?: CaseDate;
  applicant1DispensePartnerLastSeenDescription?: string;
  applicant1SearchGovRecordsPartnerLastKnownAddress1?: string;
  applicant1SearchGovRecordsPartnerLastKnownAddress2?: string;
  applicant1SearchGovRecordsPartnerLastKnownAddress3?: string;
  applicant1SearchGovRecordsPartnerLastKnownAddressTown?: string;
  applicant1SearchGovRecordsPartnerLastKnownAddressCounty?: string;
  applicant1SearchGovRecordsPartnerLastKnownAddressCountry?: string;
  applicant1SearchGovRecordsPartnerLastKnownAddressPostcode?: string;
  applicant1SearchGovRecordsPartnerLastKnownAddressOverseas: YesOrNo.NO;
  applicant1DispenseHavePartnerEmailAddresses?: YesOrNo;
  applicant1DispenseHaveSearchedFinalOrder?: YesOrNo;
  applicant1DispenseWhyNoFinalOrderSearch?: string;
  applicant1DispensePartnerEmailAddresses?: string;
  applicant1DispenseHavePartnerPhoneNumbers?: YesOrNo;
  applicant1DispensePartnerPhoneNumbers?: string;
  applicant1DispenseTriedTracingAgent?: YesOrNo;
  applicant1DispenseWhyNoTracingAgent?: string;
  applicant1DispenseTracingAgentResults?: string;
  applicant1DispenseTriedTracingOnline?: YesOrNo;
  applicant1DispenseWhyNoTracingOnline?: string;
  applicant1DispenseTracingOnlineResults?: string;
  applicant1DispenseTriedSearchingOnline?: YesOrNo;
  applicant1DispenseWhyNoSearchingOnline?: string;
  applicant1DispenseSearchingOnlineResults?: string;
  applicant1DispenseTriedContactingEmployer?: YesOrNo;
  applicant1DispenseWhyNoContactingEmployer?: string;
  applicant1DispenseEmployerName?: string;
  applicant1DispenseEmployerAddress?: string;
  applicant1DispensePartnerOccupation?: string;
  applicant1DispenseContactingEmployerResults?: string;
  applicant1DispenseChildrenOfFamily?: YesOrNo;
  applicant1DispensePartnerContactWithChildren?: YesOrNo;
  applicant1DispenseHowPartnerContactChildren?: string;
  applicant1DispensePartnerLastContactChildren?: string;
  applicant1DispenseChildMaintenanceOrder?: YesOrNo;
  applicant1DispenseChildMaintenanceResults?: string;
  applicant1DispenseContactFriendsOrRelativesDetails?: string;
  applicant1DispenseOtherEnquiries?: string;
  applicant1DispenseLiveTogether?: YesOrNo;
  applicant1DispenseLivedTogetherDate?: DateAsString;
  applicant1DispenseLastLivedTogetherDate?: CaseDate;
  applicant1DispenseLivedTogetherAddress1?: string;
  applicant1DispenseLivedTogetherAddress2?: string;
  applicant1DispenseLivedTogetherAddress3?: string;
  applicant1DispenseLivedTogetherAddressTown?: string;
  applicant1DispenseLivedTogetherAddressCounty?: string;
  applicant1DispenseLivedTogetherAddressPostcode?: string;
  applicant1DispenseLivedTogetherAddressCountry?: string;
  applicant1DispenseLivedTogetherAddressOverseas?: YesOrNo;
  applicant1DispenseAwarePartnerLived?: YesOrNo;
  applicant1DispensePartnerPastAddress1?: string;
  applicant1DispensePartnerPastAddressEnquiries1?: string;
  applicant1DispensePartnerPastAddress2?: string;
  applicant1DispensePartnerPastAddressEnquiries2?: string;
  applicant1DispensePartnerLastSeenDate?: DateAsString;
}

export interface CaseWithId extends Case {
  id: string;
  state: State;
}

export enum Checkbox {
  Checked = 'checked',
  Unchecked = '',
}

export interface CaseDate {
  year: string;
  month: string;
  day: string;
}

export enum LanguagePreference {
  English = 'english',
  Welsh = 'welsh',
}

export interface UploadedFile {
  id: string;
  name: string;
}

export type AnyObject = Record<string, unknown>;