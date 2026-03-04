/* tslint:disable */
/* eslint-disable */
// Generated using typescript-generator version 3.2.1263 on 2026-02-27 15:35:35.

export interface FinremCaseDetails extends CcdCaseDetails<FinremCaseData> {
  jurisdiction: string;
  state: State;
  created_date: DateAsString;
  security_level: number;
  callback_response_status: string;
  last_modified: DateAsString;
  security_classification: Classification;
  version: number;
  case_data: FinremCaseData;
  case_type_id: CaseType;
  locked_by_user_id: number;
}

export interface FinremCaseData extends HasCaseDocument {
  divorceCaseNumber: string;
  divorceStageReached: StageReached;
  divorceUploadEvidence1: CaseDocument;
  d11: CaseDocument;
  divorceDecreeNisiDate: DateAsString;
  divorceUploadEvidence2: CaseDocument;
  divorceDecreeAbsoluteDate: DateAsString;
  provisionMadeFor: Provision;
  applicantIntendsTo: Intention;
  dischargePeriodicalPaymentSubstituteFor: PeriodicalPaymentSubstitute[];
  applyingForConsentOrder: YesOrNo;
  authorisationName: string;
  authorisationFirm: string;
  authorisation2b: string;
  authorisation3: DateAsString;
  miniFormA: CaseDocument;
  consentOrder: CaseDocument;
  consentOrderText: CaseDocument;
  latestConsentOrder: CaseDocument;
  d81Question: YesOrNo;
  d81Joint: CaseDocument;
  d81Applicant: CaseDocument;
  d81Respondent: CaseDocument;
  pensionCollection: PensionTypeCollection[];
  consentPensionCollection: PensionTypeCollection[];
  copyOfPaperFormA: PaymentDocumentCollection[];
  orderDirection: OrderDirection;
  orderDirectionOpt1: CaseDocument;
  additionalCicDocuments: DocumentCollectionItem[];
  orderDirectionOpt2: string;
  orderDirectionAbsolute: YesOrNo;
  servePensionProvider: YesOrNo;
  servePensionProviderResponsibility: PensionProvider;
  servePensionProviderOther: string;
  orderDirectionJudge: JudgeType;
  orderDirectionJudgeName: string;
  orderDirectionDate: DateAsString;
  orderDirectionAddComments: string;
  orderRefusalCollection: OrderRefusalCollection[];
  orderRefusalCollectionNew: OrderRefusalCollection[];
  orderRefusalOnScreen: OrderRefusalHolder;
  orderRefusalPreviewDocument: CaseDocument;
  dueDate: DateAsString;
  issueDate: DateAsString;
  assignedToJudgeReason: AssignToJudgeReason;
  assignedToJudge: string;
  uploadConsentOrderDocuments: UploadConsentOrderDocumentCollection[];
  uploadOrder: UploadOrderCollection[];
  uploadDocuments: UploadDocumentCollection[];
  solUploadDocuments: SolUploadDocumentCollection[];
  respondToOrderDocuments: RespondToOrderDocumentCollection[];
  amendedConsentOrderCollection: AmendedConsentOrderCollection[];
  caseNotesCollection: CaseNotesCollection[];
  state: string;
  scannedDocuments: ScannedDocumentCollection[];
  evidenceHandled: YesOrNo;
  approvedConsentOrderLetter: CaseDocument;
  bulkPrintLetterIdRes: string;
  bulkPrintLetterIdApp: string;
  approvedOrderCollection: ConsentOrderCollection[];
  divRoleOfFrApplicant: ApplicantRole;
  applicantRepresentedPaper: ApplicantRepresentedPaper;
  authorisationSolicitorAddress: string;
  authorisationSigned: YesOrNo;
  authorisationSignedBy: AuthorisationSignedBy;
  bulkScanCaseReference: string;
  childrenInfo: ChildrenInfoCollection[];
  formA: CaseDocument;
  scannedD81s: DocumentCollectionItem[];
  transferLocalCourtName: string;
  transferLocalCourtEmail: string;
  transferLocalCourtInstructions: string;
  transferLocalCourtEmailCollection: TransferCourtEmailCollection[];
  civilPartnership: YesOrNo;
  promptForUrgentCaseQuestion: YesOrNo;
  urgentCaseQuestionDetailsTextArea: string;
  paperApplication: YesOrNo;
  dateOfMarriage: DateAsString;
  dateOfSepration: DateAsString;
  nameOfCourtDivorceCentre: string;
  divorceUploadPetition: CaseDocument;
  divorcePetitionIssuedDate: DateAsString;
  propertyAddress: string;
  mortgageDetail: string;
  additionalPropertyOrderDecision: YesOrNo;
  documentToKeepCollection: DocumentToKeepCollection[];
  paymentForChildrenDecision: YesOrNo;
  benefitForChildrenDecision: YesOrNo;
  benefitPaymentChecklist: BenefitPayment[];
  fastTrackDecision: YesOrNo;
  fastTrackDecisionReason: FastTrackReason[];
  addToComplexityListOfCourts: Complexity;
  estimatedAssetsChecklist: EstimatedAsset[];
  estimatedAssetsChecklistV2: EstimatedAssetV2;
  netValueOfHome: string;
  potentialAllegationChecklist: PotentialAllegation[];
  detailPotentialAllegation: string;
  otherReasonForComplexity: YesOrNo;
  otherReasonForComplexityText: string;
  specialAssistanceRequired: string;
  specificArrangementsRequired: string;
  isApplicantsHomeCourt: YesOrNo;
  reasonForLocalCourt: string;
  allocatedToBeHeardAtHighCourtJudgeLevel: YesOrNo;
  allocatedToBeHeardAtHighCourtJudgeLevelText: string;
  mediatorRegistrationNumber: string;
  familyMediatorServiceName: string;
  soleTraderName: string;
  uploadMediatorDocument: CaseDocument;
  uploadMediatorDocumentPaperCase: CaseDocument;
  mediatorRegistrationNumber1: string;
  familyMediatorServiceName1: string;
  soleTraderName1: string;
  promptForAnyDocument: YesOrNo;
  hearingDirectionDetailsCollection: HearingDirectionDetailsCollection[];
  hearingNoticeDocumentPack: DocumentCollectionItem[];
  hearingNoticesDocumentCollection: DocumentCollectionItem[];
  courtDetails: { [index: string]: any };
  hearingType: HearingTypeDirection;
  timeEstimate: string;
  hearingDate: DateAsString;
  hearingTime: string;
  hearing_nottinghamCourtList: NottinghamCourt;
  hearing_cfcCourtList: CfcCourt;
  hearing_birminghamCourtList: BirminghamCourt;
  hearing_liverpoolCourtList: LiverpoolCourt;
  hearing_manchesterCourtList: ManchesterCourt;
  hearing_lancashireCourtList: LancashireCourt;
  hearing_cleavelandCourtList: ClevelandCourt;
  hearing_nwyorkshireCourtList: NwYorkshireCourt;
  hearing_humberCourtList: HumberCourt;
  hearing_kentSurreyCourtList: KentSurreyCourt;
  hearing_bedfordshireCourtList: BedfordshireCourt;
  hearing_thamesvalleyCourtList: ThamesValleyCourt;
  hearing_devonCourtList: DevonCourt;
  hearing_dorsetCourtList: DorsetCourt;
  hearing_bristolCourtList: BristolCourt;
  hearing_newportCourtList: NewportCourt;
  hearing_swanseaCourtList: SwanseaCourt;
  hearing_northWalesCourtList: NorthWalesCourt;
  hearing_highCourtList: HighCourt;
  hearing_regionList: Region;
  hearing_midlandsFRCList: RegionMidlandsFrc;
  hearing_londonFRCList: RegionLondonFrc;
  hearing_northWestFRCList: RegionNorthWestFrc;
  hearing_northEastFRCList: RegionNorthEastFrc;
  hearing_southEastFRCList: RegionSouthEastFrc;
  hearing_southWestFRCList: RegionSouthWestFrc;
  hearing_walesFRCList: RegionWalesFrc;
  hearing_highCourtFRCList: RegionHighCourtFrc;
  additionalInformationAboutHearing: string;
  additionalHearingDocumentsOption: YesOrNo;
  additionalListOfHearingDocuments: CaseDocument;
  formC: CaseDocument;
  formG: CaseDocument;
  pfdNcdrComplianceLetter: CaseDocument;
  pfdNcdrCoverLetter: CaseDocument;
  additionalHearingDocuments: AdditionalHearingDocumentCollection[];
  judgeAllocated: JudgeAllocated[];
  applicationAllocatedTo: YesOrNo;
  caseAllocatedTo: YesOrNo;
  judgeTimeEstimate: JudgeTimeEstimate;
  judgeTimeEstimateTextArea: string;
  uploadGeneralDocuments: UploadGeneralDocumentCollection[];
  assignToJudgeReason: AssignToJudgeReason;
  assignToJudgeText: string;
  subjectToDecreeAbsoluteValue: YesOrNo;
  selectJudge: string;
  dateOfOrder: DateAsString;
  additionalComments: string;
  applicationNotApproved: ApplicationNotApprovedCollection[];
  attendingCourtWithAssistance: string;
  attendingCourtWithArrangement: string;
  solicitorResponsibleForDraftingOrder: SolicitorToDraftOrder;
  uploadHearingOrder: DirectionOrderCollection[];
  unprocessedUploadHearingDocuments: DirectionOrderCollection[];
  hearingOrderOtherDocuments: DocumentCollectionItem[];
  directionDetailsCollection: DirectionDetailCollection[];
  finalOrderCollection: DirectionOrderCollection[];
  intv1HearingNoticesCollection: IntervenerHearingNoticeCollection[];
  intv2HearingNoticesCollection: IntervenerHearingNoticeCollection[];
  intv3HearingNoticesCollection: IntervenerHearingNoticeCollection[];
  intv4HearingNoticesCollection: IntervenerHearingNoticeCollection[];
  judgeNotApprovedReasons: JudgeNotApprovedReasonsCollection[];
  refusalOrderJudgeType: JudgeType;
  refusalOrderJudgeName: string;
  refusalOrderDate: DateAsString;
  refusalOrderPreviewDocument: CaseDocument;
  refusalOrderCollection: RefusalOrderCollection[];
  latestRefusalOrder: CaseDocument;
  refusalOrderAdditionalDocument: CaseDocument;
  hiddenTabValue: string;
  latestDraftHearingOrder: CaseDocument;
  orderApprovedJudgeName: string;
  orderApprovedJudgeType: JudgeType;
  uploadAdditionalDocument: UploadAdditionalDocumentCollection[];
  orderApprovedDate: DateAsString;
  orderApprovedCoverLetter: CaseDocument;
  hearingDetails: string;
  applicantShareDocs: YesOrNo;
  respondentShareDocs: YesOrNo;
  hearingUploadBundle: HearingUploadBundleCollection[];
  fdrHearingBundleCollections: HearingUploadBundleCollection[];
  additionalDocument: CaseDocument;
  ordersToSend: OrdersToSend;
  sendOrderPostStateOption: SendOrderEventPostStateOption;
  /**
   * @deprecated
   */
  ordersToShare: DynamicMultiSelectList;
  partiesOnCase: DynamicMultiSelectList;
  confidentialDocumentsUploaded: ConfidentialUploadedDocumentData[];
  changeOrganisationRequestField: ChangeOrganisationRequest;
  currentUserCaseRole: CaseRole;
  currentUserCaseRoleLabel: string;
  currentUserCaseRoleType: string;
  outOfFamilyCourtResolution: CaseDocument;
  sourceDocumentList: DynamicMultiSelectList;
  solicitorRoleList: DynamicMultiSelectList;
  intervenersList: DynamicRadioList;
  intervenerOptionList: DynamicRadioList;
  manageCaseDocumentsActionSelection: ManageCaseDocumentsAction;
  manageCaseDocumentCollection: UploadCaseDocumentCollection[];
  inputManageCaseDocumentCollection: UploadCaseDocumentCollection[];
  stopRepClientConsent: YesOrNo;
  stopRepJudicialApproval: YesOrNo;
  clientAddressForServiceLabel: string;
  clientAddressForService: Address;
  clientAddressForServiceConfidential: YesOrNo;
  clientAddressForServiceConfidentialLabel: string;
  extraClientAddr1Id: string;
  extraClientAddr1Label: string;
  extraClientAddr1: Address;
  extraClientAddr1Confidential: YesOrNo;
  extraClientAddr1ConfidentialLabel: string;
  extraClientAddr2Id: string;
  extraClientAddr2Label: string;
  extraClientAddr2: Address;
  extraClientAddr2Confidential: YesOrNo;
  extraClientAddr2ConfidentialLabel: string;
  extraClientAddr3Id: string;
  extraClientAddr3Label: string;
  extraClientAddr3: Address;
  extraClientAddr3Confidential: YesOrNo;
  extraClientAddr3ConfidentialLabel: string;
  extraClientAddr4Id: string;
  extraClientAddr4Label: string;
  extraClientAddr4: Address;
  extraClientAddr4Confidential: YesOrNo;
  extraClientAddr4ConfidentialLabel: string;
  showClientAddressForService: YesOrNo;
  manageHearingsActionSelection: ManageHearingsAction;
  workingHearingId: string;
  workingHearing: WorkingHearing;
  workingVacatedHearing: WorkingVacatedHearing;
  workingVacatedHearingId: string;
  isRelistSelected: YesOrNo;
  wasRelistSelected: YesOrNo;
  isAddHearingChosen: YesOrNo;
  isFinalOrder: YesOrNo;
  shouldSendVacateOrAdjNotice: YesOrNo;
  hearings: ManageHearingsCollectionItem[];
  vacatedOrAdjournedHearings: VacatedOrAdjournedHearingsCollectionItem[];
  hearingDocumentsCollection: ManageHearingDocumentsCollectionItem[];
  hearingTabItems: HearingTabCollectionItem[];
  applicantHearingTabItems: HearingTabCollectionItem[];
  respondentHearingTabItems: HearingTabCollectionItem[];
  int1HearingTabItems: HearingTabCollectionItem[];
  int2HearingTabItems: HearingTabCollectionItem[];
  int3HearingTabItems: HearingTabCollectionItem[];
  int4HearingTabItems: HearingTabCollectionItem[];
  vacatedOrAdjournedHearingTabItems: VacatedOrAdjournedHearingTabCollectionItem[];
  applicantVacOrAdjHearingTabItems: VacatedOrAdjournedHearingTabCollectionItem[];
  respondentVacOrAdjHearingTabItems: VacatedOrAdjournedHearingTabCollectionItem[];
  int1VacOrAdjHearingTabItems: VacatedOrAdjournedHearingTabCollectionItem[];
  int2VacOrAdjHearingTabItems: VacatedOrAdjournedHearingTabCollectionItem[];
  int3VacOrAdjHearingTabItems: VacatedOrAdjournedHearingTabCollectionItem[];
  int4VacOrAdjHearingTabItems: VacatedOrAdjournedHearingTabCollectionItem[];
  typeOfDraftOrder: string;
  showUploadPartyQuestion: YesOrNo;
  consentApplicationGuidanceText: string;
  showWarningMessageToJudge: YesOrNo;
  generatedOrderReason: string;
  generatedOrderRefusedDate: DateAsString;
  generatedOrderJudgeType: JudgeType;
  generatedOrderJudgeName: string;
  refusalOrderIdsToBeSent: UuidCollection[];
  unprocessedApprovedDocuments: DirectionOrderCollection[];
  isLegacyApprovedOrderPresent: YesOrNo;
  isUnprocessedApprovedDocumentPresent: YesOrNo;
  isUnreviewedDocumentPresent: YesOrNo;
  uploadSuggestedDraftOrder: UploadSuggestedDraftOrder;
  uploadAgreedDraftOrder: UploadAgreedDraftOrder;
  draftOrdersReviewCollection: DraftOrdersReviewCollection[];
  refusedOrdersCollection: RefusedOrderCollection[];
  agreedDraftOrderCollection: AgreedDraftOrderCollection[];
  suggestedDraftOrderCollection: SuggestedDraftOrderCollection[];
  intvAgreedDraftOrderCollection: AgreedDraftOrderCollection[];
  judgeApproval1: JudgeApproval;
  judgeApproval2: JudgeApproval;
  judgeApproval3: JudgeApproval;
  judgeApproval4: JudgeApproval;
  judgeApproval5: JudgeApproval;
  hearingInstruction: HearingInstruction;
  approveOrdersConfirmationBody: string;
  extraReportFieldsInput: ExtraReportFieldsInput;
  finalisedOrdersCollection: FinalisedOrderCollection[];
  expressCaseParticipation: ExpressCaseParticipation;
  labelForExpressCaseAmendment: LabelForExpressCaseAmendment;
  expressPilotQuestion: YesOrNo;
  judgeAgreesCaseIsExpress: YesOrNo;
  confirmRemoveCaseFromExpressPilot: DynamicMultiSelectList;
  formAType: ScannedDocumentType;
  formASubtype: string;
  formAControlNumber: string;
  formAFileName: string;
  formAScannedDate: DateAsString;
  formADeliveryDate: DateAsString;
  formAExceptionRecordReference: string;
  consentOrderType: ScannedDocumentType;
  consentOrderSubtype: string;
  consentOrderControlNumber: string;
  consentOrderFileName: string;
  consentOrderScannedDate: DateAsString;
  consentOrderDeliveryDate: DateAsString;
  consentOrderExceptionRecordReference: string;
  scannedD81Collection: ScannedD81Collection[];
  nottinghamCourtList: NottinghamCourt;
  cfcCourtList: CfcCourt;
  birminghamCourtList: BirminghamCourt;
  londonCourtList: LondonCourt;
  liverpoolCourtList: LiverpoolCourt;
  manchesterCourtList: ManchesterCourt;
  lancashireCourtList: LancashireCourt;
  cleavelandCourtList: ClevelandCourt;
  clevelandCourtList: ClevelandCourt;
  humberCourtList: HumberCourt;
  kentSurreyCourtList: KentSurreyCourt;
  bedfordshireCourtList: BedfordshireCourt;
  devonCourtList: DevonCourt;
  dorsetCourtList: DorsetCourt;
  bristolCourtList: BristolCourt;
  newportCourtList: NewportCourt;
  swanseaCourtList: SwanseaCourt;
  northWalesCourtList: NorthWalesCourt;
  highCourtList: HighCourt;
  nwyorkshireCourtList: NwYorkshireCourt;
  thamesvalleyCourtList: ThamesValleyCourt;
  regionList: Region;
  midlandsFRCList: RegionMidlandsFrc;
  londonFRCList: RegionLondonFrc;
  northWestFRCList: RegionNorthWestFrc;
  northEastFRCList: RegionNorthEastFrc;
  southEastFRCList: RegionSouthEastFrc;
  southWestFRCList: RegionSouthWestFrc;
  walesFRCList: RegionWalesFrc;
  highCourtFRCList: RegionHighCourtFrc;
  interim_nottinghamCourtList: NottinghamCourt;
  interim_cfcCourtList: CfcCourt;
  interim_birminghamCourtList: BirminghamCourt;
  interim_liverpoolCourtList: LiverpoolCourt;
  interim_manchesterCourtList: ManchesterCourt;
  interim_lancashireCourtList: LancashireCourt;
  interim_cleavelandCourtList: ClevelandCourt;
  interim_nwyorkshireCourtList: NwYorkshireCourt;
  interim_humberCourtList: HumberCourt;
  interim_kentSurreyCourtList: KentSurreyCourt;
  interim_bedfordshireCourtList: BedfordshireCourt;
  interim_thamesvalleyCourtList: ThamesValleyCourt;
  interim_devonCourtList: DevonCourt;
  interim_dorsetCourtList: DorsetCourt;
  interim_bristolCourtList: BristolCourt;
  interim_newportCourtList: NewportCourt;
  interim_swanseaCourtList: SwanseaCourt;
  interim_northWalesCourtList: NorthWalesCourt;
  interim_highCourtList: HighCourt;
  interim_regionList: Region;
  interim_midlandsFRCList: RegionMidlandsFrc;
  interim_londonFRCList: RegionLondonFrc;
  interim_northWestFRCList: RegionNorthWestFrc;
  interim_northEastFRCList: RegionNorthEastFrc;
  interim_southEastFRCList: RegionSouthEastFrc;
  interim_southWestFRCList: RegionSouthWestFrc;
  interim_walesFRCList: RegionWalesFrc;
  interim_highCourtFRCList: RegionHighCourtFrc;
  generalApplicationDirections_nottinghamCourtList: NottinghamCourt;
  generalApplicationDirections_cfcCourtList: CfcCourt;
  generalApplicationDirections_birminghamCourtList: BirminghamCourt;
  generalApplicationDirections_liverpoolCourtList: LiverpoolCourt;
  generalApplicationDirections_manchesterCourtList: ManchesterCourt;
  generalApplicationDirections_lancashireCourtList: LancashireCourt;
  generalApplicationDirections_cleavelandCourtList: ClevelandCourt;
  generalApplicationDirections_nwyorkshireCourtList: NwYorkshireCourt;
  generalApplicationDirections_humberCourtList: HumberCourt;
  generalApplicationDirections_kentSurreyCourtList: KentSurreyCourt;
  generalApplicationDirections_bedfordshireCourtList: BedfordshireCourt;
  generalApplicationDirections_thamesvalleyCourtList: ThamesValleyCourt;
  generalApplicationDirections_devonCourtList: DevonCourt;
  generalApplicationDirections_dorsetCourtList: DorsetCourt;
  generalApplicationDirections_bristolCourtList: BristolCourt;
  generalApplicationDirections_newportCourtList: NewportCourt;
  generalApplicationDirections_swanseaCourtList: SwanseaCourt;
  generalApplicationDirections_northWalesCourtList: NorthWalesCourt;
  generalApplicationDirections_highCourtList: HighCourt;
  generalApplicationDirections_regionList: Region;
  generalApplicationDirections_midlandsFRCList: RegionMidlandsFrc;
  generalApplicationDirections_londonFRCList: RegionLondonFrc;
  generalApplicationDirections_northWestFRCList: RegionNorthWestFrc;
  generalApplicationDirections_northEastFRCList: RegionNorthEastFrc;
  generalApplicationDirections_southEastFRCList: RegionSouthEastFrc;
  generalApplicationDirections_southWestFRCList: RegionSouthWestFrc;
  generalApplicationDirections_walesFRCList: RegionWalesFrc;
  generalApplicationDirections_highCourtFRCList: RegionHighCourtFrc;
  referToJudgeDate: DateAsString;
  referToJudgeText: string;
  referToJudgeDateFromOrderMade: DateAsString;
  referToJudgeTextFromOrderMade: string;
  referToJudgeDateFromConsOrdApproved: DateAsString;
  referToJudgeTextFromConsOrdApproved: string;
  referToJudgeDateFromConsOrdMade: DateAsString;
  referToJudgeTextFromConsOrdMade: string;
  referToJudgeDateFromClose: DateAsString;
  referToJudgeTextFromClose: string;
  referToJudgeDateFromAwaitingResponse: DateAsString;
  referToJudgeTextFromAwaitingResponse: string;
  referToJudgeDateFromRespondToOrder: DateAsString;
  referToJudgeTextFromRespondToOrder: string;
  uploadCaseDocument: UploadCaseDocumentCollection[];
  fdrCaseDocumentCollection: UploadCaseDocumentCollection[];
  appCorrespondenceCollection: UploadCaseDocumentCollection[];
  appEvidenceCollection: UploadCaseDocumentCollection[];
  appTrialBundleCollection: UploadCaseDocumentCollection[];
  appConfidentialDocsCollection: UploadCaseDocumentCollection[];
  respCorrespondenceCollection: UploadCaseDocumentCollection[];
  respEvidenceCollection: UploadCaseDocumentCollection[];
  respTrialBundleCollection: UploadCaseDocumentCollection[];
  respConfidentialDocsCollection: UploadCaseDocumentCollection[];
  appHearingBundlesCollection: UploadCaseDocumentCollection[];
  appFormEExhibitsCollection: UploadCaseDocumentCollection[];
  appChronologiesCollection: UploadCaseDocumentCollection[];
  appStatementsExhibitsCollection: UploadCaseDocumentCollection[];
  appCaseSummariesCollection: UploadCaseDocumentCollection[];
  appFormsHCollection: UploadCaseDocumentCollection[];
  appExpertEvidenceCollection: UploadCaseDocumentCollection[];
  appCorrespondenceDocsCollection: UploadCaseDocumentCollection[];
  appOtherCollection: UploadCaseDocumentCollection[];
  respHearingBundlesCollection: UploadCaseDocumentCollection[];
  respFormEExhibitsCollection: UploadCaseDocumentCollection[];
  respChronologiesCollection: UploadCaseDocumentCollection[];
  respStatementsExhibitsCollection: UploadCaseDocumentCollection[];
  respCaseSummariesCollection: UploadCaseDocumentCollection[];
  respFormsHCollection: UploadCaseDocumentCollection[];
  respExpertEvidenceCollection: UploadCaseDocumentCollection[];
  respCorrespondenceDocsColl: UploadCaseDocumentCollection[];
  respOtherCollection: UploadCaseDocumentCollection[];
  appHearingBundlesCollectionShared: UploadCaseDocumentCollection[];
  appFormEExhibitsCollectionShared: UploadCaseDocumentCollection[];
  appChronologiesCollectionShared: UploadCaseDocumentCollection[];
  appStatementsExhibitsCollShared: UploadCaseDocumentCollection[];
  appCaseSummariesCollectionShared: UploadCaseDocumentCollection[];
  appFormsHCollectionShared: UploadCaseDocumentCollection[];
  appExpertEvidenceCollectionShared: UploadCaseDocumentCollection[];
  appCorrespondenceDocsCollShared: UploadCaseDocumentCollection[];
  appOtherCollectionShared: UploadCaseDocumentCollection[];
  respHearingBundlesCollShared: UploadCaseDocumentCollection[];
  respFormEExhibitsCollectionShared: UploadCaseDocumentCollection[];
  respChronologiesCollectionShared: UploadCaseDocumentCollection[];
  respStatementsExhibitsCollShared: UploadCaseDocumentCollection[];
  respCaseSummariesCollectionShared: UploadCaseDocumentCollection[];
  respFormsHCollectionShared: UploadCaseDocumentCollection[];
  respExpertEvidenceCollShared: UploadCaseDocumentCollection[];
  respCorrespondenceDocsCollShared: UploadCaseDocumentCollection[];
  respOtherCollectionShared: UploadCaseDocumentCollection[];
  intv1Summaries: UploadCaseDocumentCollection[];
  intv1Chronologies: UploadCaseDocumentCollection[];
  intv1CorrespDocs: UploadCaseDocumentCollection[];
  intv1ExpertEvidence: UploadCaseDocumentCollection[];
  intv1FormEsExhibits: UploadCaseDocumentCollection[];
  intv1FormHs: UploadCaseDocumentCollection[];
  intv1HearingBundles: UploadCaseDocumentCollection[];
  intv1Other: UploadCaseDocumentCollection[];
  intv1Qa: UploadCaseDocumentCollection[];
  intv1StmtsExhibits: UploadCaseDocumentCollection[];
  intv2Summaries: UploadCaseDocumentCollection[];
  intv2Chronologies: UploadCaseDocumentCollection[];
  intv2CorrespDocs: UploadCaseDocumentCollection[];
  intv2ExpertEvidence: UploadCaseDocumentCollection[];
  intv2FormEsExhibits: UploadCaseDocumentCollection[];
  intv2FormHs: UploadCaseDocumentCollection[];
  intv2HearingBundles: UploadCaseDocumentCollection[];
  intv2Other: UploadCaseDocumentCollection[];
  intv2Qa: UploadCaseDocumentCollection[];
  intv2StmtsExhibits: UploadCaseDocumentCollection[];
  intv3Summaries: UploadCaseDocumentCollection[];
  intv3Chronologies: UploadCaseDocumentCollection[];
  intv3CorrespDocs: UploadCaseDocumentCollection[];
  intv3ExpertEvidence: UploadCaseDocumentCollection[];
  intv3FormEsExhibits: UploadCaseDocumentCollection[];
  intv3FormHs: UploadCaseDocumentCollection[];
  intv3HearingBundles: UploadCaseDocumentCollection[];
  intv3Other: UploadCaseDocumentCollection[];
  intv3Qa: UploadCaseDocumentCollection[];
  intv3StmtsExhibits: UploadCaseDocumentCollection[];
  intv4Summaries: UploadCaseDocumentCollection[];
  intv4Chronologies: UploadCaseDocumentCollection[];
  intv4CorrespDocs: UploadCaseDocumentCollection[];
  intv4ExpertEvidence: UploadCaseDocumentCollection[];
  intv4FormEsExhibits: UploadCaseDocumentCollection[];
  intv4FormHs: UploadCaseDocumentCollection[];
  intv4HearingBundles: UploadCaseDocumentCollection[];
  intv4Other: UploadCaseDocumentCollection[];
  intv4Qa: UploadCaseDocumentCollection[];
  intv4StmtsExhibits: UploadCaseDocumentCollection[];
  intv1FdrCaseDocuments: UploadCaseDocumentCollection[];
  intv2FdrCaseDocuments: UploadCaseDocumentCollection[];
  intv3FdrCaseDocuments: UploadCaseDocumentCollection[];
  intv4FdrCaseDocuments: UploadCaseDocumentCollection[];
  confidentialDocumentCollection: UploadCaseDocumentCollection[];
  intv1HearingBundlesShared: UploadCaseDocumentCollection[];
  intv1ChronologiesShared: UploadCaseDocumentCollection[];
  intv1StmtsExhibitsShared: UploadCaseDocumentCollection[];
  intv1SummariesShared: UploadCaseDocumentCollection[];
  intv1ExpertEvidenceShared: UploadCaseDocumentCollection[];
  intv1CorrespDocsShared: UploadCaseDocumentCollection[];
  intv1OtherShared: UploadCaseDocumentCollection[];
  intv2HearingBundlesShared: UploadCaseDocumentCollection[];
  intv2ChronologiesShared: UploadCaseDocumentCollection[];
  intv2StmtsExhibitsShared: UploadCaseDocumentCollection[];
  intv2SummariesShared: UploadCaseDocumentCollection[];
  intv2ExpertEvidenceShared: UploadCaseDocumentCollection[];
  intv2CorrespDocsShared: UploadCaseDocumentCollection[];
  intv2OtherShared: UploadCaseDocumentCollection[];
  intv3HearingBundlesShared: UploadCaseDocumentCollection[];
  intv3ChronologiesShared: UploadCaseDocumentCollection[];
  intv3StmtsExhibitsShared: UploadCaseDocumentCollection[];
  intv3SummariesShared: UploadCaseDocumentCollection[];
  intv3ExpertEvidenceShared: UploadCaseDocumentCollection[];
  intv3CorrespDocsShared: UploadCaseDocumentCollection[];
  intv3OtherShared: UploadCaseDocumentCollection[];
  intv4HearingBundlesShared: UploadCaseDocumentCollection[];
  intv4ChronologiesShared: UploadCaseDocumentCollection[];
  intv4StmtsExhibitsShared: UploadCaseDocumentCollection[];
  intv4SummariesShared: UploadCaseDocumentCollection[];
  intv4ExpertEvidenceShared: UploadCaseDocumentCollection[];
  intv4CorrespDocsShared: UploadCaseDocumentCollection[];
  intv4OtherShared: UploadCaseDocumentCollection[];
  appFRFormsCollection: UploadCaseDocumentCollection[];
  respFRFormsCollection: UploadCaseDocumentCollection[];
  appQACollection: UploadCaseDocumentCollection[];
  respQACollection: UploadCaseDocumentCollection[];
  appQACollectionShared: UploadCaseDocumentCollection[];
  respQACollectionShared: UploadCaseDocumentCollection[];
  intv1FormEExhibitsShared: UploadCaseDocumentCollection[];
  intv1QAShared: UploadCaseDocumentCollection[];
  intv1FormsHShared: UploadCaseDocumentCollection[];
  intv2FormEExhibitsShared: UploadCaseDocumentCollection[];
  intv2QAShared: UploadCaseDocumentCollection[];
  intv2FormsHShared: UploadCaseDocumentCollection[];
  intv3FormEExhibitsShared: UploadCaseDocumentCollection[];
  intv3QAShared: UploadCaseDocumentCollection[];
  intv3FormsHShared: UploadCaseDocumentCollection[];
  intv4FormEExhibitsShared: UploadCaseDocumentCollection[];
  intv4QAShared: UploadCaseDocumentCollection[];
  intv4FormsHShared: UploadCaseDocumentCollection[];
  updateIncludesRepresentativeChange: YesOrNo;
  nocParty: NoticeOfChangeParty;
  applicantRepresented: YesOrNo;
  applicantSolicitorAddress: Address;
  applicantSolicitorName: string;
  applicantSolicitorFirm: string;
  solicitorReference: string;
  applicantSolicitorPhone: string;
  applicantSolicitorEmail: string;
  applicantSolicitorConsentForEmails: YesOrNo;
  applicantAddress: Address;
  applicantResideOutsideUK: YesOrNo;
  applicantPhone: string;
  applicantEmail: string;
  respondentAddress: Address;
  respondentResideOutsideUK: YesOrNo;
  respondentPhone: string;
  respondentEmail: string;
  solicitorName: string;
  solicitorFirm: string;
  solicitorAddress: Address;
  solicitorPhone: string;
  solicitorEmail: string;
  solicitorAgreeToReceiveEmails: YesOrNo;
  appRespondentLName: string;
  isAdmin: string;
  applicantSolicitorDXnumber: string;
  applicantFMName: string;
  applicantLName: string;
  applicantAddressConfidential: YesOrNo;
  respondentFMName: string;
  respondentLName: string;
  respondentRepresented: YesOrNo;
  rSolicitorName: string;
  rSolicitorFirm: string;
  rSolicitorReference: string;
  rSolicitorAddress: Address;
  rSolicitorPhone: string;
  rSolicitorEmail: string;
  rSolicitorDXnumber: string;
  respondentAddressConfidential: YesOrNo;
  solicitorDXnumber: string;
  appRespondentFMName: string;
  appRespondentRep: YesOrNo;
  generalApplicationDirectionsHearingRequired: YesOrNo;
  generalApplicationReceivedFrom: string;
  appRespGeneralApplicationReceivedFrom: ApplicantAndRespondentEvidenceParty;
  generalApplicationDirectionsHearingTime: string;
  generalApplicationDirectionsHearingTimeEstimate: string;
  generalApplicationDirectionsAdditionalInformation: string;
  generalApplicationDirectionsRecitals: string;
  generalApplicationDirectionsCourtOrderDate: DateAsString;
  generalApplicationDirectionsTextFromJudge: string;
  /**
   * @deprecated
   */
  generalApplicationDirectionsDocument: CaseDocument;
  generalApplicationIntvrOrders: GeneralApplicationsCollection[];
  generalApplicationNotApprovedReason: string;
  generalApplicationDirectionsHearingDate: DateAsString;
  generalApplicationDirectionsJudgeType: JudgeType;
  generalApplicationDirectionsJudgeName: string;
  generalApplicationCreatedBy: string;
  generalApplicationHearingRequired: YesOrNo;
  generalApplicationTimeEstimate: string;
  generalApplicationSpecialMeasures: string;
  generalApplicationDocument: CaseDocument;
  generalApplicationLatestDocument: CaseDocument;
  generalApplicationDraftOrder: CaseDocument;
  generalApplicationLatestDocumentDate: DateAsString;
  generalApplicationPreState: string;
  generalApplicationReferToJudgeEmail: string;
  generalApplicationOutcomeOther: string;
  generalApplicationOutcome: GeneralApplicationOutcome;
  generalApplications: GeneralApplicationsCollection[];
  appRespGeneralApplications: GeneralApplicationsCollection[];
  intervener1GeneralApplications: GeneralApplicationsCollection[];
  intervener2GeneralApplications: GeneralApplicationsCollection[];
  intervener3GeneralApplications: GeneralApplicationsCollection[];
  intervener4GeneralApplications: GeneralApplicationsCollection[];
  generalApplicationTracking: string;
  generalApplicationRejectReason: string;
  generalApplicationList: DynamicList;
  generalApplicationReferList: DynamicList;
  generalApplicationReferDetail: string;
  generalApplicationOutcomeList: DynamicList;
  generalApplicationDirectionsList: DynamicList;
  generalApplicationCollection: GeneralApplicationCollection[];
  generalOrderAddressTo: GeneralOrderAddressTo;
  generalOrderDate: DateAsString;
  generalOrderCreatedBy: string;
  generalOrderBodyText: string;
  generalOrderJudgeType: JudgeType;
  generalOrderRecitals: string;
  generalOrderJudgeName: string;
  generalOrderLatestDocument: CaseDocument;
  generalOrderPreviewDocument: CaseDocument;
  generalOrders: ContestedGeneralOrderCollection[];
  generalOrdersConsent: ContestedGeneralOrderCollection[];
  generalOrderCollection: GeneralOrderCollectionItem[];
  directionDetailsCollectionInterim: DirectionDetailInterimCollection[];
  interimTimeEstimate: string;
  interimHearingDate: DateAsString;
  interimHearingTime: string;
  interimAdditionalInformationAboutHearing: string;
  interimPromptForAnyDocument: YesOrNo;
  interimHearingType: InterimTypeOfHearing;
  interimUploadAdditionalDocument: CaseDocument;
  interimHearingDirectionsDocument: CaseDocument;
  interimHearings: InterimHearingCollection[];
  interimHearingsScreenField: InterimHearingCollection[];
  interimHearingDocuments: InterimHearingBulkPrintDocumentsData[];
  iHCollectionItemIds: InterimHearingCollectionItemData[];
  draftDirectionOrderCollection: DraftDirectionOrderCollection[];
  judgesAmendedOrderCollection: DraftDirectionOrderCollection[];
  judgeApprovedOrderCollection: DraftDirectionOrderCollection[];
  cwApprovedOrderCollection: DirectionOrderCollection[];
  generalLetterAddressee: DynamicRadioList;
  generalLetterAddressTo: GeneralLetterAddressToType;
  generalLetterRecipient: string;
  generalLetterRecipientAddress: Address;
  generalLetterCreatedBy: string;
  generalLetterBody: string;
  generalLetterPreview: CaseDocument;
  generalLetterUploadedDocument: CaseDocument;
  generalLetterUploadedDocuments: DocumentCollectionItem[];
  generalLetterCollection: GeneralLetterCollection[];
  generalEmailRecipient: string;
  generalEmailCreatedBy: string;
  generalEmailBody: string;
  generalEmailUploadedDocument: CaseDocument;
  generalEmailCollection: GeneralEmailCollection[];
  applicantAttendedMIAM: YesOrNo;
  claimingExemptionMIAM: YesOrNo;
  familyMediatorMIAM: YesOrNo;
  MIAMExemptionsChecklist: MiamExemption[];
  MIAMDomesticViolenceChecklist: MiamDomesticViolence[];
  MIAMUrgencyReasonChecklist: MiamUrgencyReason[];
  MIAMPreviousAttendanceChecklist: MiamPreviousAttendance;
  MIAMPreviousAttendanceChecklistV2: MiamPreviousAttendanceV2;
  MIAMOtherGroundsChecklist: MiamOtherGrounds;
  MIAMOtherGroundsChecklistV2: MiamOtherGroundsV2;
  evidenceUnavailableDomesticAbuseMIAM: string;
  evidenceUnavailableUrgencyMIAM: string;
  evidenceUnavailablePreviousAttendanceMIAM: string;
  evidenceUnavailableOtherGroundsMIAM: string;
  additionalInfoOtherGroundsMIAM: string;
  natureOfApplicationChecklist: NatureApplication[];
  natureOfApplication2: NatureApplication[];
  natureOfApplication3a: string;
  natureOfApplication3b: string;
  orderForChildrenQuestion1: YesOrNo;
  natureOfApplication5: YesOrNo;
  natureOfApplication5b: NatureApplication5b;
  natureOfApplication6: ChildrenOrder[];
  natureOfApplication7: string;
  latestDraftDirectionOrder: DraftDirectionOrder;
  draftDirectionDetailsCollection: DraftDirectionDetailsCollection[];
  draftDirectionDetailsCollectionRO: DraftDirectionDetailsCollection[];
  consentNatureOfApplicationChecklist: NatureApplication[];
  consentNatureOfApplicationAddress: string;
  consentNatureOfApplicationMortgage: string;
  consentOrderForChildrenQuestion1: YesOrNo;
  consentNatureOfApplication5: YesOrNo;
  consentNatureOfApplication6: ConsentNatureOfApplication[];
  consentNatureOfApplication7: string;
  consentD81Question: YesOrNo;
  consentD81Joint: CaseDocument;
  consentD81Applicant: CaseDocument;
  consentD81Respondent: CaseDocument;
  consentOtherCollection: OtherDocumentCollection[];
  consentSubjectToDecreeAbsoluteValue: YesOrNo;
  consentServePensionProvider: YesOrNo;
  consentServePensionProviderResponsibility: PensionProvider;
  consentServePensionProviderOther: string;
  consentSelectJudge: string;
  consentJudgeName: string;
  consentedNotApprovedOrders: ConsentOrderCollection[];
  consentDateOfOrder: DateAsString;
  consentAdditionalComments: string;
  consentMiniFormA: CaseDocument;
  uploadConsentedOrder: CaseDocument;
  uploadConsentOrder: UploadConsentOrderCollection[];
  consentVariationOrderLabelC: string;
  consentVariationOrderLabelL: string;
  otherDocLabel: string;
  otherVariationCollection: VariationDocumentTypeCollection[];
  uploadApprovedConsentOrder: CaseDocument;
  appConsentApprovedOrders: ConsentInContestedApprovedOrderCollection[];
  respConsentApprovedOrders: ConsentInContestedApprovedOrderCollection[];
  intv1ConsentApprovedOrders: ConsentInContestedApprovedOrderCollection[];
  intv2ConsentApprovedOrders: ConsentInContestedApprovedOrderCollection[];
  intv3ConsentApprovedOrders: ConsentInContestedApprovedOrderCollection[];
  intv4ConsentApprovedOrders: ConsentInContestedApprovedOrderCollection[];
  appRefusedOrderCollection: UnapprovedOrderCollection[];
  respRefusedOrderCollection: UnapprovedOrderCollection[];
  intv1RefusedOrderCollection: UnapprovedOrderCollection[];
  intv2RefusedOrderCollection: UnapprovedOrderCollection[];
  intv3RefusedOrderCollection: UnapprovedOrderCollection[];
  intv4RefusedOrderCollection: UnapprovedOrderCollection[];
  latestDivorceOrderUpload: CaseDocument;
  consentOrderFRCName: string;
  consentOrderFRCAddress: string;
  consentOrderFRCEmail: string;
  consentOrderFRCPhone: string;
  Contested_ConsentedApprovedOrders: ConsentOrderCollection[];
  appOrderCollections: ApprovedOrderConsolidateCollection[];
  respOrderCollections: ApprovedOrderConsolidateCollection[];
  intv1OrderCollections: ApprovedOrderConsolidateCollection[];
  intv2OrderCollections: ApprovedOrderConsolidateCollection[];
  intv3OrderCollections: ApprovedOrderConsolidateCollection[];
  intv4OrderCollections: ApprovedOrderConsolidateCollection[];
  appOrderCollection: ApprovedOrderCollection[];
  respOrderCollection: ApprovedOrderCollection[];
  intv1OrderCollection: ApprovedOrderCollection[];
  intv2OrderCollection: ApprovedOrderCollection[];
  intv3OrderCollection: ApprovedOrderCollection[];
  intv4OrderCollection: ApprovedOrderCollection[];
  bulkPrintCoverSheetApp: CaseDocument;
  bulkPrintCoverSheetRes: CaseDocument;
  bulkPrintCoverSheetIntv1: CaseDocument;
  bulkPrintCoverSheetIntv2: CaseDocument;
  bulkPrintCoverSheetIntv3: CaseDocument;
  bulkPrintCoverSheetIntv4: CaseDocument;
  bulkPrintCoverSheetAppConfidential: CaseDocument;
  bulkPrintCoverSheetResConfidential: CaseDocument;
  applicantScanDocuments: ScannedDocumentCollection[];
  respondentScanDocuments: ScannedDocumentCollection[];
  manageScannedDocumentCollection: ManageScannedDocumentCollection[];
  appBarristerCollection: BarristerCollectionItem[];
  respBarristerCollection: BarristerCollectionItem[];
  intvr1BarristerCollection: BarristerCollectionItem[];
  intvr2BarristerCollection: BarristerCollectionItem[];
  intvr3BarristerCollection: BarristerCollectionItem[];
  intvr4BarristerCollection: BarristerCollectionItem[];
  barristerParty: BarristerParty;
  benefitForChildrenDecisionSchedule: YesOrNo;
  benefitPaymentChecklistSchedule: BenefitPaymentChecklist[];
  variationOrderDocument: CaseDocument;
  consentVariationOrderDocument: CaseDocument;
  isNocRejected: YesOrNo;
  isCfvCategoriesAppliedFlag: YesOrNo;
  cfvMigrationVersion: string;
  cfvSearchableMigrationVersion: string;
  isListForHearingsMigrated: YesOrNo;
  isListForInterimHearingsMigrated: YesOrNo;
  isGeneralApplicationMigrated: YesOrNo;
  isDirectionDetailsCollectionMigrated: YesOrNo;
  isHearingDirectionDetailsCollectionMigrated: YesOrNo;
  mhMigrationVersion: string;
  isNocFixAppliedFlag: YesOrNo;
  ordersSentToPartiesCollection: OrderSentToPartiesCollection[];
  typeOfApplication: Schedule1OrMatrimonialAndCpList;
  childrenCollection: ChildDetailsCollectionElement[];
  natureOfApplicationChecklistSchedule: NatureOfApplicationSchedule[];
  consentNatureOfApplicationChecklistSchedule: NatureOfApplicationSchedule[];
  listForHearings: ConsentedHearingDataWrapper[];
  caseFlags: CaseFlag;
  applicantFlags: CaseFlag;
  respondentFlags: CaseFlag;
  previousState: string;
  userCaseAccessList: DynamicList;
  respondentInRefugeQuestion: YesOrNo;
  respondentInRefugeTab: YesOrNo;
  applicantInRefugeQuestion: YesOrNo;
  applicantInRefugeTab: YesOrNo;
  helpWithFeesQuestion: YesOrNo;
  amountToPay: number;
  orderSummary: OrderSummary;
  HWFNumber: string;
  PBANumber: string;
  PBAreference: string;
  PBAPaymentReference: string;
  applicantAccessCodes: AccessCodeCollection[];
  respondentAccessCodes: AccessCodeCollection[];
  ChildSupportAgencyCalculationMade: YesOrNo;
  ChildSupportAgencyCalculationReason: string;
  otherCollection: OtherDocumentCollection[];
  RepresentationUpdateHistory: RepresentationUpdateHistoryCollection[];
  RespSolNotificationsEmailConsent: YesOrNo;
  propertyAdjutmentOrderDetail: PropertyAdjustmentOrderCollection[];
  reasonForFRCLocation: string;
  ApplicantOrganisationPolicy: OrganisationPolicy;
  RespondentOrganisationPolicy: OrganisationPolicy;
  intervener1: IntervenerOne;
  intervener2: IntervenerTwo;
  intervener3: IntervenerThree;
  intervener4: IntervenerFour;
  typeOfDocument: ScannedDocumentTypeOption;
  ccdCaseId: string;
}

export interface CaseDocument extends DocumentFileNameProvider {
  document_url: string;
  document_filename: string;
  document_binary_url: string;
  category_id: string;
  upload_timestamp: DateAsString;
}

export interface PensionTypeCollection extends HasCaseDocument {
  id: string;
  value: PensionType;
}

export interface PaymentDocumentCollection extends HasCaseDocument {
  value: PaymentDocument;
}

export interface DocumentCollectionItem extends HasCaseDocument {
  id: string;
  value: CaseDocument;
}

export interface OrderRefusalCollection extends HasCaseDocument {
  value: OrderRefusalHolder;
}

export interface OrderRefusalHolder extends HasCaseDocument {
  orderRefusalAfterText: string;
  orderRefusal: OrderRefusalOption[];
  orderRefusalOther: string;
  orderRefusalDocs: CaseDocument;
  orderRefusalJudgeName: string;
  orderRefusalDate: DateAsString;
  orderRefusalAddComments: string;
  orderRefusalJudge: JudgeType;
}

export interface UploadConsentOrderDocumentCollection extends HasCaseDocument {
  value: UploadConsentOrderDocument;
}

export interface UploadOrderCollection extends HasCaseDocument {
  value: UploadOrder;
  id: string;
}

export interface UploadDocumentCollection extends HasCaseDocument {
  value: UploadDocument;
}

export interface SolUploadDocumentCollection {
  value: SolUploadDocument;
}

export interface RespondToOrderDocumentCollection extends HasCaseDocument {
  value: RespondToOrderDocument;
}

export interface AmendedConsentOrderCollection extends HasCaseDocument {
  value: AmendedConsentOrder;
}

export interface CaseNotesCollection {
  value: CaseNotes;
}

export interface ScannedDocumentCollection extends HasCaseDocument {
  id: string;
  value: ScannedDocument;
}

export interface ConsentOrderCollection extends HasCaseDocument {
  id: string;
  value: ApprovedOrder;
}

export interface ChildrenInfoCollection {
  value: ChildrenInfo;
}

export interface TransferCourtEmailCollection {
  value: TransferCourtEmail;
}

export interface DocumentToKeepCollection {
  value: DocumentToKeep;
}

export interface HearingDirectionDetailsCollection {
  id: string;
  value: HearingDirectionDetail;
}

export interface ListForHearingWrapper extends HasCaseDocument {
  hearingType: HearingTypeDirection;
  timeEstimate: string;
  hearingDate: DateAsString;
  hearingTime: string;
  hearing_nottinghamCourtList: NottinghamCourt;
  hearing_cfcCourtList: CfcCourt;
  hearing_birminghamCourtList: BirminghamCourt;
  hearing_liverpoolCourtList: LiverpoolCourt;
  hearing_manchesterCourtList: ManchesterCourt;
  hearing_lancashireCourtList: LancashireCourt;
  hearing_cleavelandCourtList: ClevelandCourt;
  hearing_nwyorkshireCourtList: NwYorkshireCourt;
  hearing_humberCourtList: HumberCourt;
  hearing_kentSurreyCourtList: KentSurreyCourt;
  hearing_bedfordshireCourtList: BedfordshireCourt;
  hearing_thamesvalleyCourtList: ThamesValleyCourt;
  hearing_devonCourtList: DevonCourt;
  hearing_dorsetCourtList: DorsetCourt;
  hearing_bristolCourtList: BristolCourt;
  hearing_newportCourtList: NewportCourt;
  hearing_swanseaCourtList: SwanseaCourt;
  hearing_northWalesCourtList: NorthWalesCourt;
  hearing_highCourtList: HighCourt;
  hearing_regionList: Region;
  hearing_midlandsFRCList: RegionMidlandsFrc;
  hearing_londonFRCList: RegionLondonFrc;
  hearing_northWestFRCList: RegionNorthWestFrc;
  hearing_northEastFRCList: RegionNorthEastFrc;
  hearing_southEastFRCList: RegionSouthEastFrc;
  hearing_southWestFRCList: RegionSouthWestFrc;
  hearing_walesFRCList: RegionWalesFrc;
  hearing_highCourtFRCList: RegionHighCourtFrc;
  additionalInformationAboutHearing: string;
  additionalHearingDocumentsOption: YesOrNo;
  additionalListOfHearingDocuments: CaseDocument;
  formC: CaseDocument;
  formG: CaseDocument;
  pfdNcdrComplianceLetter: CaseDocument;
  pfdNcdrCoverLetter: CaseDocument;
  additionalHearingDocuments: AdditionalHearingDocumentCollection[];
}

export interface UploadGeneralDocumentCollection extends HasCaseDocument {
  value: UploadGeneralDocument;
}

export interface ApplicationNotApprovedCollection {
  value: ApplicationNotApproved;
}

export interface DirectionOrderCollection
  extends HasCaseDocument,
    WithAttachmentsCollection,
    UploadedApprovedOrderHolder {
  id: string;
  value: DirectionOrder;
}

export interface DirectionDetailCollection {
  value: DirectionDetail;
  id: string;
}

export interface IntervenerHearingNoticeCollection extends HasCaseDocument {
  id: string;
  value: IntervenerHearingNotice;
}

export interface JudgeNotApprovedReasonsCollection {
  value: JudgeNotApprovedReason;
}

export interface RefusalOrderCollection extends HasCaseDocument {
  value: RefusalOrder;
}

export interface UploadAdditionalDocumentCollection extends HasCaseDocument {
  value: UploadAdditionalDocument;
}

export interface HearingUploadBundleCollection {
  value: HearingUploadBundleHolder;
}

export interface SendOrderWrapper {
  additionalDocument: CaseDocument;
  ordersToSend: OrdersToSend;
  sendOrderPostStateOption: SendOrderEventPostStateOption;
  /**
   * @deprecated
   */
  ordersToShare: DynamicMultiSelectList;
}

export interface DynamicMultiSelectList {
  value: DynamicMultiSelectListElement[];
  list_items: DynamicMultiSelectListElement[];
  valueByCodes: string[];
}

/**
 * @deprecated
 */
export interface ConfidentialUploadedDocumentData extends CaseDocumentTabData, HasCaseDocument {
  id: string;
  value: UploadConfidentialDocument;
}

export interface ChangeOrganisationRequest {
  NotesReason: string;
  CaseRoleId: DynamicList;
  RequestTimestamp: DateAsString;
  ApprovalRejectionTimeStamp: DateAsString;
  OrganisationToAdd: Organisation;
  OrganisationToRemove: Organisation;
  ApprovalStatus: ChangeOrganisationApprovalStatus;
}

export interface DynamicRadioList {
  value: DynamicRadioListElement;
  list_items: DynamicRadioListElement[];
}

export interface ManageCaseDocumentsWrapper extends HasCaseDocument {
  manageCaseDocumentsActionSelection: ManageCaseDocumentsAction;
  manageCaseDocumentCollection: UploadCaseDocumentCollection[];
  inputManageCaseDocumentCollection: UploadCaseDocumentCollection[];
}

export interface StopRepresentationWrapper {
  stopRepClientConsent: YesOrNo;
  stopRepJudicialApproval: YesOrNo;
  clientAddressForServiceLabel: string;
  clientAddressForService: Address;
  clientAddressForServiceConfidential: YesOrNo;
  clientAddressForServiceConfidentialLabel: string;
  extraClientAddr1Id: string;
  extraClientAddr1Label: string;
  extraClientAddr1: Address;
  extraClientAddr1Confidential: YesOrNo;
  extraClientAddr1ConfidentialLabel: string;
  extraClientAddr2Id: string;
  extraClientAddr2Label: string;
  extraClientAddr2: Address;
  extraClientAddr2Confidential: YesOrNo;
  extraClientAddr2ConfidentialLabel: string;
  extraClientAddr3Id: string;
  extraClientAddr3Label: string;
  extraClientAddr3: Address;
  extraClientAddr3Confidential: YesOrNo;
  extraClientAddr3ConfidentialLabel: string;
  extraClientAddr4Id: string;
  extraClientAddr4Label: string;
  extraClientAddr4: Address;
  extraClientAddr4Confidential: YesOrNo;
  extraClientAddr4ConfidentialLabel: string;
  showClientAddressForService: YesOrNo;
}

export interface ManageHearingsWrapper {
  manageHearingsActionSelection: ManageHearingsAction;
  workingHearingId: string;
  workingHearing: WorkingHearing;
  workingVacatedHearing: WorkingVacatedHearing;
  workingVacatedHearingId: string;
  isRelistSelected: YesOrNo;
  wasRelistSelected: YesOrNo;
  isAddHearingChosen: YesOrNo;
  isFinalOrder: YesOrNo;
  shouldSendVacateOrAdjNotice: YesOrNo;
  hearings: ManageHearingsCollectionItem[];
  vacatedOrAdjournedHearings: VacatedOrAdjournedHearingsCollectionItem[];
  hearingDocumentsCollection: ManageHearingDocumentsCollectionItem[];
  hearingTabItems: HearingTabCollectionItem[];
  applicantHearingTabItems: HearingTabCollectionItem[];
  respondentHearingTabItems: HearingTabCollectionItem[];
  int1HearingTabItems: HearingTabCollectionItem[];
  int2HearingTabItems: HearingTabCollectionItem[];
  int3HearingTabItems: HearingTabCollectionItem[];
  int4HearingTabItems: HearingTabCollectionItem[];
  vacatedOrAdjournedHearingTabItems: VacatedOrAdjournedHearingTabCollectionItem[];
  applicantVacOrAdjHearingTabItems: VacatedOrAdjournedHearingTabCollectionItem[];
  respondentVacOrAdjHearingTabItems: VacatedOrAdjournedHearingTabCollectionItem[];
  int1VacOrAdjHearingTabItems: VacatedOrAdjournedHearingTabCollectionItem[];
  int2VacOrAdjHearingTabItems: VacatedOrAdjournedHearingTabCollectionItem[];
  int3VacOrAdjHearingTabItems: VacatedOrAdjournedHearingTabCollectionItem[];
  int4VacOrAdjHearingTabItems: VacatedOrAdjournedHearingTabCollectionItem[];
}

export interface DraftOrdersWrapper extends HasCaseDocument {
  typeOfDraftOrder: string;
  showUploadPartyQuestion: YesOrNo;
  consentApplicationGuidanceText: string;
  showWarningMessageToJudge: YesOrNo;
  generatedOrderReason: string;
  generatedOrderRefusedDate: DateAsString;
  generatedOrderJudgeType: JudgeType;
  generatedOrderJudgeName: string;
  refusalOrderIdsToBeSent: UuidCollection[];
  unprocessedApprovedDocuments: DirectionOrderCollection[];
  isLegacyApprovedOrderPresent: YesOrNo;
  isUnprocessedApprovedDocumentPresent: YesOrNo;
  isUnreviewedDocumentPresent: YesOrNo;
  uploadSuggestedDraftOrder: UploadSuggestedDraftOrder;
  uploadAgreedDraftOrder: UploadAgreedDraftOrder;
  draftOrdersReviewCollection: DraftOrdersReviewCollection[];
  refusedOrdersCollection: RefusedOrderCollection[];
  agreedDraftOrderCollection: AgreedDraftOrderCollection[];
  suggestedDraftOrderCollection: SuggestedDraftOrderCollection[];
  intvAgreedDraftOrderCollection: AgreedDraftOrderCollection[];
  judgeApproval1: JudgeApproval;
  judgeApproval2: JudgeApproval;
  judgeApproval3: JudgeApproval;
  judgeApproval4: JudgeApproval;
  judgeApproval5: JudgeApproval;
  hearingInstruction: HearingInstruction;
  approveOrdersConfirmationBody: string;
  extraReportFieldsInput: ExtraReportFieldsInput;
  finalisedOrdersCollection: FinalisedOrderCollection[];
}

export interface ExpressCaseWrapper {
  expressCaseParticipation: ExpressCaseParticipation;
  labelForExpressCaseAmendment: LabelForExpressCaseAmendment;
  expressPilotQuestion: YesOrNo;
  judgeAgreesCaseIsExpress: YesOrNo;
  confirmRemoveCaseFromExpressPilot: DynamicMultiSelectList;
}

export interface FormAScannedDocWrapper {
  formAType: ScannedDocumentType;
  formASubtype: string;
  formAControlNumber: string;
  formAFileName: string;
  formAScannedDate: DateAsString;
  formADeliveryDate: DateAsString;
  formAExceptionRecordReference: string;
}

export interface ConsentOrderScannedDocWrapper {
  consentOrderType: ScannedDocumentType;
  consentOrderSubtype: string;
  consentOrderControlNumber: string;
  consentOrderFileName: string;
  consentOrderScannedDate: DateAsString;
  consentOrderDeliveryDate: DateAsString;
  consentOrderExceptionRecordReference: string;
}

export interface ScannedD81Collection {
  id: string;
  value: ScannedD81Document;
}

export interface RegionWrapper {
  nottinghamCourtList: NottinghamCourt;
  cfcCourtList: CfcCourt;
  birminghamCourtList: BirminghamCourt;
  londonCourtList: LondonCourt;
  liverpoolCourtList: LiverpoolCourt;
  manchesterCourtList: ManchesterCourt;
  lancashireCourtList: LancashireCourt;
  cleavelandCourtList: ClevelandCourt;
  clevelandCourtList: ClevelandCourt;
  humberCourtList: HumberCourt;
  kentSurreyCourtList: KentSurreyCourt;
  bedfordshireCourtList: BedfordshireCourt;
  devonCourtList: DevonCourt;
  dorsetCourtList: DorsetCourt;
  bristolCourtList: BristolCourt;
  newportCourtList: NewportCourt;
  swanseaCourtList: SwanseaCourt;
  northWalesCourtList: NorthWalesCourt;
  highCourtList: HighCourt;
  nwyorkshireCourtList: NwYorkshireCourt;
  thamesvalleyCourtList: ThamesValleyCourt;
  regionList: Region;
  midlandsFRCList: RegionMidlandsFrc;
  londonFRCList: RegionLondonFrc;
  northWestFRCList: RegionNorthWestFrc;
  northEastFRCList: RegionNorthEastFrc;
  southEastFRCList: RegionSouthEastFrc;
  southWestFRCList: RegionSouthWestFrc;
  walesFRCList: RegionWalesFrc;
  highCourtFRCList: RegionHighCourtFrc;
  interim_nottinghamCourtList: NottinghamCourt;
  interim_cfcCourtList: CfcCourt;
  interim_birminghamCourtList: BirminghamCourt;
  interim_liverpoolCourtList: LiverpoolCourt;
  interim_manchesterCourtList: ManchesterCourt;
  interim_lancashireCourtList: LancashireCourt;
  interim_cleavelandCourtList: ClevelandCourt;
  interim_nwyorkshireCourtList: NwYorkshireCourt;
  interim_humberCourtList: HumberCourt;
  interim_kentSurreyCourtList: KentSurreyCourt;
  interim_bedfordshireCourtList: BedfordshireCourt;
  interim_thamesvalleyCourtList: ThamesValleyCourt;
  interim_devonCourtList: DevonCourt;
  interim_dorsetCourtList: DorsetCourt;
  interim_bristolCourtList: BristolCourt;
  interim_newportCourtList: NewportCourt;
  interim_swanseaCourtList: SwanseaCourt;
  interim_northWalesCourtList: NorthWalesCourt;
  interim_highCourtList: HighCourt;
  interim_regionList: Region;
  interim_midlandsFRCList: RegionMidlandsFrc;
  interim_londonFRCList: RegionLondonFrc;
  interim_northWestFRCList: RegionNorthWestFrc;
  interim_northEastFRCList: RegionNorthEastFrc;
  interim_southEastFRCList: RegionSouthEastFrc;
  interim_southWestFRCList: RegionSouthWestFrc;
  interim_walesFRCList: RegionWalesFrc;
  interim_highCourtFRCList: RegionHighCourtFrc;
  generalApplicationDirections_nottinghamCourtList: NottinghamCourt;
  generalApplicationDirections_cfcCourtList: CfcCourt;
  generalApplicationDirections_birminghamCourtList: BirminghamCourt;
  generalApplicationDirections_liverpoolCourtList: LiverpoolCourt;
  generalApplicationDirections_manchesterCourtList: ManchesterCourt;
  generalApplicationDirections_lancashireCourtList: LancashireCourt;
  generalApplicationDirections_cleavelandCourtList: ClevelandCourt;
  generalApplicationDirections_nwyorkshireCourtList: NwYorkshireCourt;
  generalApplicationDirections_humberCourtList: HumberCourt;
  generalApplicationDirections_kentSurreyCourtList: KentSurreyCourt;
  generalApplicationDirections_bedfordshireCourtList: BedfordshireCourt;
  generalApplicationDirections_thamesvalleyCourtList: ThamesValleyCourt;
  generalApplicationDirections_devonCourtList: DevonCourt;
  generalApplicationDirections_dorsetCourtList: DorsetCourt;
  generalApplicationDirections_bristolCourtList: BristolCourt;
  generalApplicationDirections_newportCourtList: NewportCourt;
  generalApplicationDirections_swanseaCourtList: SwanseaCourt;
  generalApplicationDirections_northWalesCourtList: NorthWalesCourt;
  generalApplicationDirections_highCourtList: HighCourt;
  generalApplicationDirections_regionList: Region;
  generalApplicationDirections_midlandsFRCList: RegionMidlandsFrc;
  generalApplicationDirections_londonFRCList: RegionLondonFrc;
  generalApplicationDirections_northWestFRCList: RegionNorthWestFrc;
  generalApplicationDirections_northEastFRCList: RegionNorthEastFrc;
  generalApplicationDirections_southEastFRCList: RegionSouthEastFrc;
  generalApplicationDirections_southWestFRCList: RegionSouthWestFrc;
  generalApplicationDirections_walesFRCList: RegionWalesFrc;
  generalApplicationDirections_highCourtFRCList: RegionHighCourtFrc;
}

export interface ReferToJudgeWrapper {
  referToJudgeDate: DateAsString;
  referToJudgeText: string;
  referToJudgeDateFromOrderMade: DateAsString;
  referToJudgeTextFromOrderMade: string;
  referToJudgeDateFromConsOrdApproved: DateAsString;
  referToJudgeTextFromConsOrdApproved: string;
  referToJudgeDateFromConsOrdMade: DateAsString;
  referToJudgeTextFromConsOrdMade: string;
  referToJudgeDateFromClose: DateAsString;
  referToJudgeTextFromClose: string;
  referToJudgeDateFromAwaitingResponse: DateAsString;
  referToJudgeTextFromAwaitingResponse: string;
  referToJudgeDateFromRespondToOrder: DateAsString;
  referToJudgeTextFromRespondToOrder: string;
}

export interface UploadCaseDocumentWrapper extends HasCaseDocument {
  uploadCaseDocument: UploadCaseDocumentCollection[];
  fdrCaseDocumentCollection: UploadCaseDocumentCollection[];
  appCorrespondenceCollection: UploadCaseDocumentCollection[];
  appEvidenceCollection: UploadCaseDocumentCollection[];
  appTrialBundleCollection: UploadCaseDocumentCollection[];
  appConfidentialDocsCollection: UploadCaseDocumentCollection[];
  respCorrespondenceCollection: UploadCaseDocumentCollection[];
  respEvidenceCollection: UploadCaseDocumentCollection[];
  respTrialBundleCollection: UploadCaseDocumentCollection[];
  respConfidentialDocsCollection: UploadCaseDocumentCollection[];
  appHearingBundlesCollection: UploadCaseDocumentCollection[];
  appFormEExhibitsCollection: UploadCaseDocumentCollection[];
  appChronologiesCollection: UploadCaseDocumentCollection[];
  appStatementsExhibitsCollection: UploadCaseDocumentCollection[];
  appCaseSummariesCollection: UploadCaseDocumentCollection[];
  appFormsHCollection: UploadCaseDocumentCollection[];
  appExpertEvidenceCollection: UploadCaseDocumentCollection[];
  appCorrespondenceDocsCollection: UploadCaseDocumentCollection[];
  appOtherCollection: UploadCaseDocumentCollection[];
  respHearingBundlesCollection: UploadCaseDocumentCollection[];
  respFormEExhibitsCollection: UploadCaseDocumentCollection[];
  respChronologiesCollection: UploadCaseDocumentCollection[];
  respStatementsExhibitsCollection: UploadCaseDocumentCollection[];
  respCaseSummariesCollection: UploadCaseDocumentCollection[];
  respFormsHCollection: UploadCaseDocumentCollection[];
  respExpertEvidenceCollection: UploadCaseDocumentCollection[];
  respCorrespondenceDocsColl: UploadCaseDocumentCollection[];
  respOtherCollection: UploadCaseDocumentCollection[];
  appHearingBundlesCollectionShared: UploadCaseDocumentCollection[];
  appFormEExhibitsCollectionShared: UploadCaseDocumentCollection[];
  appChronologiesCollectionShared: UploadCaseDocumentCollection[];
  appStatementsExhibitsCollShared: UploadCaseDocumentCollection[];
  appCaseSummariesCollectionShared: UploadCaseDocumentCollection[];
  appFormsHCollectionShared: UploadCaseDocumentCollection[];
  appExpertEvidenceCollectionShared: UploadCaseDocumentCollection[];
  appCorrespondenceDocsCollShared: UploadCaseDocumentCollection[];
  appOtherCollectionShared: UploadCaseDocumentCollection[];
  respHearingBundlesCollShared: UploadCaseDocumentCollection[];
  respFormEExhibitsCollectionShared: UploadCaseDocumentCollection[];
  respChronologiesCollectionShared: UploadCaseDocumentCollection[];
  respStatementsExhibitsCollShared: UploadCaseDocumentCollection[];
  respCaseSummariesCollectionShared: UploadCaseDocumentCollection[];
  respFormsHCollectionShared: UploadCaseDocumentCollection[];
  respExpertEvidenceCollShared: UploadCaseDocumentCollection[];
  respCorrespondenceDocsCollShared: UploadCaseDocumentCollection[];
  respOtherCollectionShared: UploadCaseDocumentCollection[];
  intv1Summaries: UploadCaseDocumentCollection[];
  intv1Chronologies: UploadCaseDocumentCollection[];
  intv1CorrespDocs: UploadCaseDocumentCollection[];
  intv1ExpertEvidence: UploadCaseDocumentCollection[];
  intv1FormEsExhibits: UploadCaseDocumentCollection[];
  intv1FormHs: UploadCaseDocumentCollection[];
  intv1HearingBundles: UploadCaseDocumentCollection[];
  intv1Other: UploadCaseDocumentCollection[];
  intv1Qa: UploadCaseDocumentCollection[];
  intv1StmtsExhibits: UploadCaseDocumentCollection[];
  intv2Summaries: UploadCaseDocumentCollection[];
  intv2Chronologies: UploadCaseDocumentCollection[];
  intv2CorrespDocs: UploadCaseDocumentCollection[];
  intv2ExpertEvidence: UploadCaseDocumentCollection[];
  intv2FormEsExhibits: UploadCaseDocumentCollection[];
  intv2FormHs: UploadCaseDocumentCollection[];
  intv2HearingBundles: UploadCaseDocumentCollection[];
  intv2Other: UploadCaseDocumentCollection[];
  intv2Qa: UploadCaseDocumentCollection[];
  intv2StmtsExhibits: UploadCaseDocumentCollection[];
  intv3Summaries: UploadCaseDocumentCollection[];
  intv3Chronologies: UploadCaseDocumentCollection[];
  intv3CorrespDocs: UploadCaseDocumentCollection[];
  intv3ExpertEvidence: UploadCaseDocumentCollection[];
  intv3FormEsExhibits: UploadCaseDocumentCollection[];
  intv3FormHs: UploadCaseDocumentCollection[];
  intv3HearingBundles: UploadCaseDocumentCollection[];
  intv3Other: UploadCaseDocumentCollection[];
  intv3Qa: UploadCaseDocumentCollection[];
  intv3StmtsExhibits: UploadCaseDocumentCollection[];
  intv4Summaries: UploadCaseDocumentCollection[];
  intv4Chronologies: UploadCaseDocumentCollection[];
  intv4CorrespDocs: UploadCaseDocumentCollection[];
  intv4ExpertEvidence: UploadCaseDocumentCollection[];
  intv4FormEsExhibits: UploadCaseDocumentCollection[];
  intv4FormHs: UploadCaseDocumentCollection[];
  intv4HearingBundles: UploadCaseDocumentCollection[];
  intv4Other: UploadCaseDocumentCollection[];
  intv4Qa: UploadCaseDocumentCollection[];
  intv4StmtsExhibits: UploadCaseDocumentCollection[];
  intv1FdrCaseDocuments: UploadCaseDocumentCollection[];
  intv2FdrCaseDocuments: UploadCaseDocumentCollection[];
  intv3FdrCaseDocuments: UploadCaseDocumentCollection[];
  intv4FdrCaseDocuments: UploadCaseDocumentCollection[];
  confidentialDocumentCollection: UploadCaseDocumentCollection[];
  intv1HearingBundlesShared: UploadCaseDocumentCollection[];
  intv1ChronologiesShared: UploadCaseDocumentCollection[];
  intv1StmtsExhibitsShared: UploadCaseDocumentCollection[];
  intv1SummariesShared: UploadCaseDocumentCollection[];
  intv1ExpertEvidenceShared: UploadCaseDocumentCollection[];
  intv1CorrespDocsShared: UploadCaseDocumentCollection[];
  intv1OtherShared: UploadCaseDocumentCollection[];
  intv2HearingBundlesShared: UploadCaseDocumentCollection[];
  intv2ChronologiesShared: UploadCaseDocumentCollection[];
  intv2StmtsExhibitsShared: UploadCaseDocumentCollection[];
  intv2SummariesShared: UploadCaseDocumentCollection[];
  intv2ExpertEvidenceShared: UploadCaseDocumentCollection[];
  intv2CorrespDocsShared: UploadCaseDocumentCollection[];
  intv2OtherShared: UploadCaseDocumentCollection[];
  intv3HearingBundlesShared: UploadCaseDocumentCollection[];
  intv3ChronologiesShared: UploadCaseDocumentCollection[];
  intv3StmtsExhibitsShared: UploadCaseDocumentCollection[];
  intv3SummariesShared: UploadCaseDocumentCollection[];
  intv3ExpertEvidenceShared: UploadCaseDocumentCollection[];
  intv3CorrespDocsShared: UploadCaseDocumentCollection[];
  intv3OtherShared: UploadCaseDocumentCollection[];
  intv4HearingBundlesShared: UploadCaseDocumentCollection[];
  intv4ChronologiesShared: UploadCaseDocumentCollection[];
  intv4StmtsExhibitsShared: UploadCaseDocumentCollection[];
  intv4SummariesShared: UploadCaseDocumentCollection[];
  intv4ExpertEvidenceShared: UploadCaseDocumentCollection[];
  intv4CorrespDocsShared: UploadCaseDocumentCollection[];
  intv4OtherShared: UploadCaseDocumentCollection[];
  appFRFormsCollection: UploadCaseDocumentCollection[];
  respFRFormsCollection: UploadCaseDocumentCollection[];
  appQACollection: UploadCaseDocumentCollection[];
  respQACollection: UploadCaseDocumentCollection[];
  appQACollectionShared: UploadCaseDocumentCollection[];
  respQACollectionShared: UploadCaseDocumentCollection[];
  intv1FormEExhibitsShared: UploadCaseDocumentCollection[];
  intv1QAShared: UploadCaseDocumentCollection[];
  intv1FormsHShared: UploadCaseDocumentCollection[];
  intv2FormEExhibitsShared: UploadCaseDocumentCollection[];
  intv2QAShared: UploadCaseDocumentCollection[];
  intv2FormsHShared: UploadCaseDocumentCollection[];
  intv3FormEExhibitsShared: UploadCaseDocumentCollection[];
  intv3QAShared: UploadCaseDocumentCollection[];
  intv3FormsHShared: UploadCaseDocumentCollection[];
  intv4FormEExhibitsShared: UploadCaseDocumentCollection[];
  intv4QAShared: UploadCaseDocumentCollection[];
  intv4FormsHShared: UploadCaseDocumentCollection[];
}

export interface ContactDetailsWrapper {
  updateIncludesRepresentativeChange: YesOrNo;
  nocParty: NoticeOfChangeParty;
  applicantRepresented: YesOrNo;
  applicantSolicitorAddress: Address;
  applicantSolicitorName: string;
  applicantSolicitorFirm: string;
  solicitorReference: string;
  applicantSolicitorPhone: string;
  applicantSolicitorEmail: string;
  applicantSolicitorConsentForEmails: YesOrNo;
  applicantAddress: Address;
  applicantResideOutsideUK: YesOrNo;
  applicantPhone: string;
  applicantEmail: string;
  respondentAddress: Address;
  respondentResideOutsideUK: YesOrNo;
  respondentPhone: string;
  respondentEmail: string;
  solicitorName: string;
  solicitorFirm: string;
  solicitorAddress: Address;
  solicitorPhone: string;
  solicitorEmail: string;
  solicitorAgreeToReceiveEmails: YesOrNo;
  appRespondentLName: string;
  isAdmin: string;
  applicantSolicitorDXnumber: string;
  applicantFMName: string;
  applicantLName: string;
  applicantAddressConfidential: YesOrNo;
  respondentFMName: string;
  respondentLName: string;
  respondentRepresented: YesOrNo;
  rSolicitorName: string;
  rSolicitorFirm: string;
  rSolicitorReference: string;
  rSolicitorAddress: Address;
  rSolicitorPhone: string;
  rSolicitorEmail: string;
  rSolicitorDXnumber: string;
  respondentAddressConfidential: YesOrNo;
  solicitorDXnumber: string;
  appRespondentFMName: string;
  appRespondentRep: YesOrNo;
}

export interface GeneralApplicationWrapper extends HasCaseDocument {
  generalApplicationDirectionsHearingRequired: YesOrNo;
  generalApplicationReceivedFrom: string;
  appRespGeneralApplicationReceivedFrom: ApplicantAndRespondentEvidenceParty;
  generalApplicationDirectionsHearingTime: string;
  generalApplicationDirectionsHearingTimeEstimate: string;
  generalApplicationDirectionsAdditionalInformation: string;
  generalApplicationDirectionsRecitals: string;
  generalApplicationDirectionsCourtOrderDate: DateAsString;
  generalApplicationDirectionsTextFromJudge: string;
  /**
   * @deprecated
   */
  generalApplicationDirectionsDocument: CaseDocument;
  generalApplicationIntvrOrders: GeneralApplicationsCollection[];
  generalApplicationNotApprovedReason: string;
  generalApplicationDirectionsHearingDate: DateAsString;
  generalApplicationDirectionsJudgeType: JudgeType;
  generalApplicationDirectionsJudgeName: string;
  generalApplicationCreatedBy: string;
  generalApplicationHearingRequired: YesOrNo;
  generalApplicationTimeEstimate: string;
  generalApplicationSpecialMeasures: string;
  generalApplicationDocument: CaseDocument;
  generalApplicationLatestDocument: CaseDocument;
  generalApplicationDraftOrder: CaseDocument;
  generalApplicationLatestDocumentDate: DateAsString;
  generalApplicationPreState: string;
  generalApplicationReferToJudgeEmail: string;
  generalApplicationOutcomeOther: string;
  generalApplicationOutcome: GeneralApplicationOutcome;
  generalApplications: GeneralApplicationsCollection[];
  appRespGeneralApplications: GeneralApplicationsCollection[];
  intervener1GeneralApplications: GeneralApplicationsCollection[];
  intervener2GeneralApplications: GeneralApplicationsCollection[];
  intervener3GeneralApplications: GeneralApplicationsCollection[];
  intervener4GeneralApplications: GeneralApplicationsCollection[];
  generalApplicationTracking: string;
  generalApplicationRejectReason: string;
  generalApplicationList: DynamicList;
  generalApplicationReferList: DynamicList;
  generalApplicationReferDetail: string;
  generalApplicationOutcomeList: DynamicList;
  generalApplicationDirectionsList: DynamicList;
  generalApplicationCollection: GeneralApplicationCollection[];
}

export interface GeneralOrderWrapper extends HasCaseDocument {
  generalOrderAddressTo: GeneralOrderAddressTo;
  generalOrderDate: DateAsString;
  generalOrderCreatedBy: string;
  generalOrderBodyText: string;
  generalOrderJudgeType: JudgeType;
  generalOrderRecitals: string;
  generalOrderJudgeName: string;
  generalOrderLatestDocument: CaseDocument;
  generalOrderPreviewDocument: CaseDocument;
  generalOrders: ContestedGeneralOrderCollection[];
  generalOrdersConsent: ContestedGeneralOrderCollection[];
  generalOrderCollection: GeneralOrderCollectionItem[];
}

export interface InterimWrapper extends HasCaseDocument {
  directionDetailsCollectionInterim: DirectionDetailInterimCollection[];
  interimTimeEstimate: string;
  interimHearingDate: DateAsString;
  interimHearingTime: string;
  interimAdditionalInformationAboutHearing: string;
  interimPromptForAnyDocument: YesOrNo;
  interimHearingType: InterimTypeOfHearing;
  interimUploadAdditionalDocument: CaseDocument;
  interimHearingDirectionsDocument: CaseDocument;
  interimHearings: InterimHearingCollection[];
  interimHearingsScreenField: InterimHearingCollection[];
  interimHearingDocuments: InterimHearingBulkPrintDocumentsData[];
  iHCollectionItemIds: InterimHearingCollectionItemData[];
}

export interface DraftDirectionWrapper extends HasCaseDocument {
  draftDirectionOrderCollection: DraftDirectionOrderCollection[];
  latestDraftDirectionOrder: DraftDirectionOrder;
  judgesAmendedOrderCollection: DraftDirectionOrderCollection[];
  draftDirectionDetailsCollection: DraftDirectionDetailsCollection[];
  draftDirectionDetailsCollectionRO: DraftDirectionDetailsCollection[];
  judgeApprovedOrderCollection: DraftDirectionOrderCollection[];
  cwApprovedOrderCollection: DirectionOrderCollection[];
}

export interface GeneralLetterWrapper extends HasCaseDocument {
  generalLetterAddressee: DynamicRadioList;
  generalLetterAddressTo: GeneralLetterAddressToType;
  generalLetterRecipient: string;
  generalLetterRecipientAddress: Address;
  generalLetterCreatedBy: string;
  generalLetterBody: string;
  generalLetterPreview: CaseDocument;
  generalLetterUploadedDocument: CaseDocument;
  generalLetterUploadedDocuments: DocumentCollectionItem[];
  generalLetterCollection: GeneralLetterCollection[];
}

export interface GeneralEmailWrapper extends HasCaseDocument {
  generalEmailRecipient: string;
  generalEmailCreatedBy: string;
  generalEmailBody: string;
  generalEmailUploadedDocument: CaseDocument;
  generalEmailCollection: GeneralEmailCollection[];
}

export interface MiamWrapper {
  applicantAttendedMIAM: YesOrNo;
  claimingExemptionMIAM: YesOrNo;
  familyMediatorMIAM: YesOrNo;
  MIAMExemptionsChecklist: MiamExemption[];
  MIAMDomesticViolenceChecklist: MiamDomesticViolence[];
  MIAMUrgencyReasonChecklist: MiamUrgencyReason[];
  MIAMPreviousAttendanceChecklist: MiamPreviousAttendance;
  MIAMPreviousAttendanceChecklistV2: MiamPreviousAttendanceV2;
  MIAMOtherGroundsChecklist: MiamOtherGrounds;
  MIAMOtherGroundsChecklistV2: MiamOtherGroundsV2;
  evidenceUnavailableDomesticAbuseMIAM: string;
  evidenceUnavailableUrgencyMIAM: string;
  evidenceUnavailablePreviousAttendanceMIAM: string;
  evidenceUnavailableOtherGroundsMIAM: string;
  additionalInfoOtherGroundsMIAM: string;
}

export interface NatureApplicationWrapper {
  natureOfApplicationChecklist: NatureApplication[];
  natureOfApplication2: NatureApplication[];
  natureOfApplication3a: string;
  natureOfApplication3b: string;
  orderForChildrenQuestion1: YesOrNo;
  natureOfApplication5: YesOrNo;
  natureOfApplication5b: NatureApplication5b;
  natureOfApplication6: ChildrenOrder[];
  natureOfApplication7: string;
}

export interface ConsentOrderWrapper extends HasCaseDocument {
  latestDraftDirectionOrder: DraftDirectionOrder;
  draftDirectionDetailsCollection: DraftDirectionDetailsCollection[];
  draftDirectionDetailsCollectionRO: DraftDirectionDetailsCollection[];
  consentNatureOfApplicationChecklist: NatureApplication[];
  consentNatureOfApplicationAddress: string;
  consentNatureOfApplicationMortgage: string;
  consentOrderForChildrenQuestion1: YesOrNo;
  consentNatureOfApplication5: YesOrNo;
  consentNatureOfApplication6: ConsentNatureOfApplication[];
  consentNatureOfApplication7: string;
  consentD81Question: YesOrNo;
  consentD81Joint: CaseDocument;
  consentD81Applicant: CaseDocument;
  consentD81Respondent: CaseDocument;
  consentOtherCollection: OtherDocumentCollection[];
  consentSubjectToDecreeAbsoluteValue: YesOrNo;
  consentServePensionProvider: YesOrNo;
  consentServePensionProviderResponsibility: PensionProvider;
  consentServePensionProviderOther: string;
  consentSelectJudge: string;
  consentJudgeName: string;
  consentedNotApprovedOrders: ConsentOrderCollection[];
  consentDateOfOrder: DateAsString;
  consentAdditionalComments: string;
  consentMiniFormA: CaseDocument;
  uploadConsentedOrder: CaseDocument;
  uploadConsentOrder: UploadConsentOrderCollection[];
  consentVariationOrderLabelC: string;
  consentVariationOrderLabelL: string;
  otherDocLabel: string;
  otherVariationCollection: VariationDocumentTypeCollection[];
  uploadApprovedConsentOrder: CaseDocument;
  appConsentApprovedOrders: ConsentInContestedApprovedOrderCollection[];
  respConsentApprovedOrders: ConsentInContestedApprovedOrderCollection[];
  intv1ConsentApprovedOrders: ConsentInContestedApprovedOrderCollection[];
  intv2ConsentApprovedOrders: ConsentInContestedApprovedOrderCollection[];
  intv3ConsentApprovedOrders: ConsentInContestedApprovedOrderCollection[];
  intv4ConsentApprovedOrders: ConsentInContestedApprovedOrderCollection[];
  appRefusedOrderCollection: UnapprovedOrderCollection[];
  respRefusedOrderCollection: UnapprovedOrderCollection[];
  intv1RefusedOrderCollection: UnapprovedOrderCollection[];
  intv2RefusedOrderCollection: UnapprovedOrderCollection[];
  intv3RefusedOrderCollection: UnapprovedOrderCollection[];
  intv4RefusedOrderCollection: UnapprovedOrderCollection[];
  latestDivorceOrderUpload: CaseDocument;
  consentOrderFRCName: string;
  consentOrderFRCAddress: string;
  consentOrderFRCEmail: string;
  consentOrderFRCPhone: string;
  Contested_ConsentedApprovedOrders: ConsentOrderCollection[];
}

export interface OrderWrapper extends HasCaseDocument {
  appOrderCollections: ApprovedOrderConsolidateCollection[];
  respOrderCollections: ApprovedOrderConsolidateCollection[];
  intv1OrderCollections: ApprovedOrderConsolidateCollection[];
  intv2OrderCollections: ApprovedOrderConsolidateCollection[];
  intv3OrderCollections: ApprovedOrderConsolidateCollection[];
  intv4OrderCollections: ApprovedOrderConsolidateCollection[];
  appOrderCollection: ApprovedOrderCollection[];
  respOrderCollection: ApprovedOrderCollection[];
  intv1OrderCollection: ApprovedOrderCollection[];
  intv2OrderCollection: ApprovedOrderCollection[];
  intv3OrderCollection: ApprovedOrderCollection[];
  intv4OrderCollection: ApprovedOrderCollection[];
}

export interface BulkPrintCoversheetWrapper extends HasCaseDocument {
  bulkPrintCoverSheetApp: CaseDocument;
  bulkPrintCoverSheetRes: CaseDocument;
  bulkPrintCoverSheetIntv1: CaseDocument;
  bulkPrintCoverSheetIntv2: CaseDocument;
  bulkPrintCoverSheetIntv3: CaseDocument;
  bulkPrintCoverSheetIntv4: CaseDocument;
  bulkPrintCoverSheetAppConfidential: CaseDocument;
  bulkPrintCoverSheetResConfidential: CaseDocument;
}

export interface ManageScannedDocumentCollection extends HasCaseDocument {
  id: string;
  value: ManageScannedDocument;
}

export interface BarristerCollectionWrapper {
  appBarristerCollection: BarristerCollectionItem[];
  respBarristerCollection: BarristerCollectionItem[];
  intvr1BarristerCollection: BarristerCollectionItem[];
  intvr2BarristerCollection: BarristerCollectionItem[];
  intvr3BarristerCollection: BarristerCollectionItem[];
  intvr4BarristerCollection: BarristerCollectionItem[];
}

export interface CfvMigrationWrapper {
  isCfvCategoriesAppliedFlag: YesOrNo;
  cfvMigrationVersion: string;
  cfvSearchableMigrationVersion: string;
}

export interface MhMigrationWrapper {
  isListForHearingsMigrated: YesOrNo;
  isListForInterimHearingsMigrated: YesOrNo;
  isGeneralApplicationMigrated: YesOrNo;
  isDirectionDetailsCollectionMigrated: YesOrNo;
  isHearingDirectionDetailsCollectionMigrated: YesOrNo;
  mhMigrationVersion: string;
}

export interface OrderSentToPartiesCollection extends HasCaseDocument {
  id: string;
  value: SendOrderDocuments;
}

export interface ScheduleOneWrapper {
  typeOfApplication: Schedule1OrMatrimonialAndCpList;
  childrenCollection: ChildDetailsCollectionElement[];
  natureOfApplicationChecklistSchedule: NatureOfApplicationSchedule[];
  consentNatureOfApplicationChecklistSchedule: NatureOfApplicationSchedule[];
}

export interface ConsentedHearingDataWrapper extends HasCaseDocument {
  id: string;
  value: ConsentedHearingDataElement;
}

export interface CaseFlagsWrapper {
  caseFlags: CaseFlag;
  applicantFlags: CaseFlag;
  respondentFlags: CaseFlag;
}

export interface DynamicList {
  value: DynamicListElement;
  list_items: DynamicListElement[];
}

export interface RefugeWrapper {
  respondentInRefugeQuestion: YesOrNo;
  respondentInRefugeTab: YesOrNo;
  applicantInRefugeQuestion: YesOrNo;
  applicantInRefugeTab: YesOrNo;
}

export interface PaymentDetailsWrapper {
  helpWithFeesQuestion: YesOrNo;
  amountToPay: number;
  orderSummary: OrderSummary;
  HWFNumber: string;
  PBANumber: string;
  PBAreference: string;
  PBAPaymentReference: string;
}

export interface AccessCodeCollection {
  id: string;
  value: AccessCodeEntry;
}

export interface OtherDocumentCollection extends HasCaseDocument {
  value: OtherDocument;
}

export interface RepresentationUpdateHistoryCollection {
  id: string;
  value: RepresentationUpdate;
}

export interface PropertyAdjustmentOrderCollection {
  value: PropertyAdjustmentOrder;
}

export interface OrganisationPolicy {
  Organisation: Organisation;
  OrgPolicyCaseAssignedRole: string;
  OrgPolicyReference: string;
}

export interface IntervenerOne extends IntervenerWrapper {}

export interface IntervenerTwo extends IntervenerWrapper {}

export interface IntervenerThree extends IntervenerWrapper {}

export interface IntervenerFour extends IntervenerWrapper {}

export interface HasCaseDocument {}

export interface CcdCaseDetails<D> {
  id: number;
  data: D;
  caseType: CaseType;
}

export interface DocumentFileNameProvider {
  documentFilename: string;
}

export interface PensionType extends HasCaseDocument {
  typeOfDocument: PensionDocumentType;
  uploadedDocument: CaseDocument;
}

export interface PaymentDocument extends HasCaseDocument {
  typeOfDocument: PaymentDocumentType;
  uploadedDocument: CaseDocument;
}

export interface UploadConsentOrderDocument extends HasCaseDocument {
  DocumentType: UploadConsentOrderDocumentType;
  DocumentEmailContent: string;
  DocumentLink: CaseDocument;
  DocumentDateAdded: DateAsString;
  DocumentComment: string;
  DocumentFileName: string;
}

export interface UploadOrder extends HasCaseDocument {
  DocumentType: UploadOrderDocumentType;
  DocumentLink: CaseDocument;
  DocumentEmailContent: string;
  DocumentDateAdded: DateAsString;
  DocumentComment: string;
  DocumentFileName: string;
}

export interface UploadDocument extends HasUploadingDocuments, HasCaseDocument {
  DocumentType: UploadDocumentType;
  DocumentEmailContent: string;
  DocumentLink: CaseDocument;
  DocumentDateAdded: DateAsString;
  DocumentComment: string;
  DocumentFileName: string;
}

export interface SolUploadDocument {
  DocumentType: SolUploadDocumentType;
  DocumentEmailContent: string;
  DocumentLink: CaseDocument;
  DocumentDateAdded: DateAsString;
  DocumentComment: string;
  DocumentFileName: string;
}

export interface RespondToOrderDocument extends HasCaseDocument {
  DocumentType: RespondToOrderDocumentType;
  DocumentEmailContent: string;
  DocumentLink: CaseDocument;
  DocumentDateAdded: DateAsString;
  DocumentFileName: string;
}

export interface AmendedConsentOrder extends HasCaseDocument, HasUploadingDocuments {
  amendedConsentOrder: CaseDocument;
  amendedConsentOrderDate: DateAsString;
}

export interface CaseNotes {
  caseNoteAuthor: string;
  caseNoteDate: DateAsString;
  caseNote: string;
}

export interface ScannedDocument extends HasCaseDocument {
  type: ScannedDocumentType;
  subtype: string;
  url: CaseDocument;
  controlNumber: string;
  fileName: string;
  scannedDate: DateAsString;
  deliveryDate: DateAsString;
  exceptionRecordReference: string;
}

export interface ApprovedOrder extends HasCaseDocument {
  orderLetter: CaseDocument;
  consentOrder: CaseDocument;
  pensionDocuments: PensionTypeCollection[];
}

export interface ChildrenInfo {
  name: string;
  dateOfBirth: DateAsString;
  gender: Gender;
  relationshipToRespondent: string;
  relationshipToApplicant: string;
  countryOfResidence: string;
}

export interface TransferCourtEmail {
  transferLocalCourtEmail: string;
  transferLocalCourtName: string;
  transferLocalCourtInstructions: string;
}

export interface DocumentToKeep {
  documentId: string;
  caseDocument: CaseDocument;
  caseDocumentUploadedDate: DateAsString;
}

export interface HearingDirectionDetail {
  isThisFinalYN: YesOrNo;
  isAnotherHearingYN: YesOrNo;
  timeEstimate: string;
  dateOfHearing: DateAsString;
  hearingTime: string;
  localCourt: Court;
  nottinghamList: NottinghamCourt;
  cfcList: CfcCourt;
  typeOfHearing: HearingTypeDirection;
}

export interface HearingRegionWrapper {
  hearing_nottinghamCourtList: NottinghamCourt;
  hearing_cfcCourtList: CfcCourt;
  hearing_birminghamCourtList: BirminghamCourt;
  hearing_liverpoolCourtList: LiverpoolCourt;
  hearing_manchesterCourtList: ManchesterCourt;
  hearing_lancashireCourtList: LancashireCourt;
  hearing_cleavelandCourtList: ClevelandCourt;
  hearing_nwyorkshireCourtList: NwYorkshireCourt;
  hearing_humberCourtList: HumberCourt;
  hearing_kentSurreyCourtList: KentSurreyCourt;
  hearing_bedfordshireCourtList: BedfordshireCourt;
  hearing_thamesvalleyCourtList: ThamesValleyCourt;
  hearing_devonCourtList: DevonCourt;
  hearing_dorsetCourtList: DorsetCourt;
  hearing_bristolCourtList: BristolCourt;
  hearing_newportCourtList: NewportCourt;
  hearing_swanseaCourtList: SwanseaCourt;
  hearing_northWalesCourtList: NorthWalesCourt;
  hearing_highCourtList: HighCourt;
  hearing_regionList: Region;
  hearing_midlandsFRCList: RegionMidlandsFrc;
  hearing_londonFRCList: RegionLondonFrc;
  hearing_northWestFRCList: RegionNorthWestFrc;
  hearing_northEastFRCList: RegionNorthEastFrc;
  hearing_southEastFRCList: RegionSouthEastFrc;
  hearing_southWestFRCList: RegionSouthWestFrc;
  hearing_walesFRCList: RegionWalesFrc;
  hearing_highCourtFRCList: RegionHighCourtFrc;
}

export interface AdditionalHearingDocumentCollection extends HasCaseDocument {
  value: AdditionalHearingDocument;
}

export interface UploadGeneralDocument extends HasUploadingDocuments, HasCaseDocument {
  generalDocumentUploadDateTime: DateAsString;
  DocumentType: UploadGeneralDocumentType;
  DocumentEmailContent: string;
  DocumentLink: CaseDocument;
  DocumentDateAdded: DateAsString;
  DocumentComment: string;
  DocumentFileName: string;
}

export interface ApplicationNotApproved {
  andAfter: string;
  othersTextOrders: string;
  reasonForRefusal: RefusalReason[];
  selectJudge: string;
  dateOfOrder: DateAsString;
  additionalComments: string;
}

export interface DirectionOrder extends HasCaseDocument, WithAttachments, HasUploadingDocuments, UploadedApprovedOrder {
  uploadDraftDocument: CaseDocument;
  orderDateTime: DateAsString;
  isOrderStamped: YesOrNo;
  originalDocument: CaseDocument;
}

export interface WithAttachmentsCollection {
  value: WithAttachments;
}

export interface UploadedApprovedOrderHolder {
  value: UploadedApprovedOrder;
}

export interface DirectionDetail {
  isAnotherHearingYN: YesOrNo;
  timeEstimate: string;
  dateOfHearing: DateAsString;
  hearingTime: string;
  localCourt: Court;
  /**
   * @deprecated
   */
  nottinghamList: NottinghamCourt;
  /**
   * @deprecated
   */
  cfcList: CfcCourt;
  typeOfHearing: HearingTypeDirection;
}

export interface IntervenerHearingNotice extends HasCaseDocument {
  noticeReceivedAt: DateAsString;
  hearingNotice: CaseDocument;
}

export interface JudgeNotApprovedReason {
  judgeNotApprovedReasons: string;
}

export interface RefusalOrder extends HasCaseDocument {
  refusalOrderAdditionalDocument: CaseDocument;
}

export interface UploadAdditionalDocument extends HasCaseDocument {
  additionalDocuments: CaseDocument;
  additionalDocumentType: AdditionalDocumentType;
}

export interface HearingUploadBundleHolder {
  hearingBundleDate: DateAsString;
  hearingBundleFdr: YesOrNo;
  hearingBundleDocuments: HearingBundleDocumentCollection[];
  hearingBundleDescription: string;
}

export interface OrdersToSend {
  value: OrderToShareCollection[];
}

export interface DynamicMultiSelectListElement {
  code: string;
  label: string;
}

/**
 * @deprecated
 */
export interface UploadConfidentialDocument extends HasCaseDocument {
  confidentialDocumentUploadDateTime: DateAsString;
  DocumentType: CaseDocumentType;
  DocumentLink: CaseDocument;
  DocumentDateAdded: DateAsString;
  DocumentComment: string;
  DocumentFileName: string;
}

export interface CaseDocumentTabData {
  elementId: string;
}

export interface Organisation {
  OrganisationID: string;
  OrganisationName: string;
}

export interface DynamicRadioListElement {
  code: string;
  label: string;
}

export interface UploadCaseDocumentCollection extends CaseDocumentTabData, HasCaseDocument {
  id: string;
  value: UploadCaseDocument;
}

export interface Address {
  AddressLine1: string;
  AddressLine2: string;
  AddressLine3: string;
  County: string;
  Country: string;
  PostTown: string;
  PostCode: string;
}

export interface WorkingHearing {
  hearingDate: DateAsString;
  hearingTypeDynamicList: DynamicList;
  hearingTimeEstimate: string;
  hearingTime: string;
  hearingCourtSelection: Court;
  hearingMode: HearingMode;
  additionalHearingInformation: string;
  hearingNoticePrompt: YesOrNo;
  additionalHearingDocPrompt: YesOrNo;
  additionalHearingDocs: DocumentCollectionItem[];
  partiesOnCaseMultiSelectList: DynamicMultiSelectList;
}

export interface WorkingVacatedHearing {
  vacateOrAdjournAction: VacateOrAdjournAction;
  chooseHearings: DynamicList;
  vacateHearingDate: DateAsString;
  vacateReason: VacateOrAdjournReason;
  specifyOtherReason: string;
}

export interface ManageHearingsCollectionItem {
  id: string;
  value: Hearing;
}

export interface VacatedOrAdjournedHearingsCollectionItem {
  id: string;
  value: VacateOrAdjournedHearing;
}

export interface ManageHearingDocumentsCollectionItem {
  id: string;
  value: ManageHearingDocument;
}

export interface HearingTabCollectionItem {
  id: string;
  value: HearingTabItem;
}

export interface VacatedOrAdjournedHearingTabCollectionItem {
  id: string;
  value: VacatedOrAdjournedHearingTabItem;
}

export interface UuidCollection {
  value: string;
}

export interface UploadSuggestedDraftOrder {
  confirmUploadedDocuments: DynamicMultiSelectList;
  uploadParty: DynamicRadioList;
  uploadOrdersOrPsas: string[];
  suggestedDraftOrderCollection: UploadSuggestedDraftOrderCollection[];
  suggestedPsaCollection: SuggestedPensionSharingAnnexCollection[];
}

export interface UploadAgreedDraftOrder {
  confirmUploadedDocuments: DynamicMultiSelectList;
  hearingDetails: DynamicList;
  judgeKnownAtHearing: YesOrNo;
  judge: string;
  uploadParty: DynamicRadioList;
  uploadOrdersOrPsas: string[];
  agreedDraftOrderCollection: UploadAgreedDraftOrderCollection[];
  agreedPsaCollection: AgreedPensionSharingAnnexCollection[];
}

export interface DraftOrdersReviewCollection extends HasCaseDocument {
  value: DraftOrdersReview;
}

export interface RefusedOrderCollection extends HasCaseDocument {
  id: string;
  value: RefusedOrder;
}

export interface AgreedDraftOrderCollection extends HasCaseDocument, HasApprovable, WithAttachmentsCollection {
  value: AgreedDraftOrder;
}

export interface SuggestedDraftOrderCollection extends HasCaseDocument {
  value: SuggestedDraftOrder;
}

export interface JudgeApproval {
  docType: JudgeApprovalDocType;
  title: string;
  inlineDocType: string;
  hearingInfo: string;
  hearingDate: DateAsString;
  hearingJudge: string;
  hasAttachment: YesOrNo;
  document: CaseDocument;
  amendedDocument: CaseDocument;
  judgeDecision: JudgeDecision;
  attachments: DocumentCollectionItem[];
  isFinalOrder: DynamicMultiSelectList;
  courtOrderDate: DateAsString;
  changesRequestedByJudge: string;
}

export interface HearingInstruction {
  requireAnotherHearing: YesOrNo;
  showRequireAnotherHearingQuestion: YesOrNo;
  anotherHearingRequestCollection: AnotherHearingRequestCollection[];
}

export interface ExtraReportFieldsInput {
  showRequireExtraReportFieldsInputQuestion: YesOrNo;
  judgeType: JudgeType;
}

export interface FinalisedOrderCollection extends HasCaseDocument, WithAttachmentsCollection {
  id: string;
  value: FinalisedOrder;
}

export interface ScannedD81Document {
  documentLink: CaseDocument;
  type: ScannedDocumentType;
  subtype: string;
  controlNumber: string;
  fileName: string;
  scannedDate: DateAsString;
  deliveryDate: DateAsString;
  exceptionRecordReference: string;
}

export interface AllocatedRegionWrapper {
  nottinghamCourtList: NottinghamCourt;
  cfcCourtList: CfcCourt;
  birminghamCourtList: BirminghamCourt;
  londonCourtList: LondonCourt;
  liverpoolCourtList: LiverpoolCourt;
  manchesterCourtList: ManchesterCourt;
  lancashireCourtList: LancashireCourt;
  cleavelandCourtList: ClevelandCourt;
  clevelandCourtList: ClevelandCourt;
  humberCourtList: HumberCourt;
  kentSurreyCourtList: KentSurreyCourt;
  bedfordshireCourtList: BedfordshireCourt;
  devonCourtList: DevonCourt;
  dorsetCourtList: DorsetCourt;
  bristolCourtList: BristolCourt;
  newportCourtList: NewportCourt;
  swanseaCourtList: SwanseaCourt;
  northWalesCourtList: NorthWalesCourt;
  highCourtList: HighCourt;
  nwyorkshireCourtList: NwYorkshireCourt;
  thamesvalleyCourtList: ThamesValleyCourt;
  regionList: Region;
  midlandsFRCList: RegionMidlandsFrc;
  londonFRCList: RegionLondonFrc;
  northWestFRCList: RegionNorthWestFrc;
  northEastFRCList: RegionNorthEastFrc;
  southEastFRCList: RegionSouthEastFrc;
  southWestFRCList: RegionSouthWestFrc;
  walesFRCList: RegionWalesFrc;
  highCourtFRCList: RegionHighCourtFrc;
}

export interface InterimRegionWrapper {
  interim_nottinghamCourtList: NottinghamCourt;
  interim_cfcCourtList: CfcCourt;
  interim_birminghamCourtList: BirminghamCourt;
  interim_liverpoolCourtList: LiverpoolCourt;
  interim_manchesterCourtList: ManchesterCourt;
  interim_lancashireCourtList: LancashireCourt;
  interim_cleavelandCourtList: ClevelandCourt;
  interim_nwyorkshireCourtList: NwYorkshireCourt;
  interim_humberCourtList: HumberCourt;
  interim_kentSurreyCourtList: KentSurreyCourt;
  interim_bedfordshireCourtList: BedfordshireCourt;
  interim_thamesvalleyCourtList: ThamesValleyCourt;
  interim_devonCourtList: DevonCourt;
  interim_dorsetCourtList: DorsetCourt;
  interim_bristolCourtList: BristolCourt;
  interim_newportCourtList: NewportCourt;
  interim_swanseaCourtList: SwanseaCourt;
  interim_northWalesCourtList: NorthWalesCourt;
  interim_highCourtList: HighCourt;
  interim_regionList: Region;
  interim_midlandsFRCList: RegionMidlandsFrc;
  interim_londonFRCList: RegionLondonFrc;
  interim_northWestFRCList: RegionNorthWestFrc;
  interim_northEastFRCList: RegionNorthEastFrc;
  interim_southEastFRCList: RegionSouthEastFrc;
  interim_southWestFRCList: RegionSouthWestFrc;
  interim_walesFRCList: RegionWalesFrc;
  interim_highCourtFRCList: RegionHighCourtFrc;
}

export interface GeneralApplicationRegionWrapper {
  generalApplicationDirections_nottinghamCourtList: NottinghamCourt;
  generalApplicationDirections_cfcCourtList: CfcCourt;
  generalApplicationDirections_birminghamCourtList: BirminghamCourt;
  generalApplicationDirections_liverpoolCourtList: LiverpoolCourt;
  generalApplicationDirections_manchesterCourtList: ManchesterCourt;
  generalApplicationDirections_lancashireCourtList: LancashireCourt;
  generalApplicationDirections_cleavelandCourtList: ClevelandCourt;
  generalApplicationDirections_nwyorkshireCourtList: NwYorkshireCourt;
  generalApplicationDirections_humberCourtList: HumberCourt;
  generalApplicationDirections_kentSurreyCourtList: KentSurreyCourt;
  generalApplicationDirections_bedfordshireCourtList: BedfordshireCourt;
  generalApplicationDirections_thamesvalleyCourtList: ThamesValleyCourt;
  generalApplicationDirections_devonCourtList: DevonCourt;
  generalApplicationDirections_dorsetCourtList: DorsetCourt;
  generalApplicationDirections_bristolCourtList: BristolCourt;
  generalApplicationDirections_newportCourtList: NewportCourt;
  generalApplicationDirections_swanseaCourtList: SwanseaCourt;
  generalApplicationDirections_northWalesCourtList: NorthWalesCourt;
  generalApplicationDirections_highCourtList: HighCourt;
  generalApplicationDirections_regionList: Region;
  generalApplicationDirections_midlandsFRCList: RegionMidlandsFrc;
  generalApplicationDirections_londonFRCList: RegionLondonFrc;
  generalApplicationDirections_northWestFRCList: RegionNorthWestFrc;
  generalApplicationDirections_northEastFRCList: RegionNorthEastFrc;
  generalApplicationDirections_southEastFRCList: RegionSouthEastFrc;
  generalApplicationDirections_southWestFRCList: RegionSouthWestFrc;
  generalApplicationDirections_walesFRCList: RegionWalesFrc;
  generalApplicationDirections_highCourtFRCList: RegionHighCourtFrc;
}

export interface GeneralApplicationsCollection extends HasCaseDocument {
  id: string;
  value: GeneralApplicationItems;
}

export interface GeneralApplicationCollection extends HasCaseDocument {
  value: GeneralApplication;
}

export interface ContestedGeneralOrderCollection extends HasCaseDocument {
  value: ContestedGeneralOrder;
}

export interface GeneralOrderCollectionItem extends CollectionElement<GeneralOrder>, HasCaseDocument {
  value: GeneralOrder;
}

export interface DirectionDetailInterimCollection {
  value: DirectionDetailInterim;
}

export interface InterimHearingCollection extends HasCaseDocument {
  id: string;
  value: InterimHearingItem;
}

export interface InterimHearingBulkPrintDocumentsData extends HasCaseDocument {
  id: string;
  value: InterimHearingBulkPrintDocument;
}

export interface InterimHearingCollectionItemData {
  id: string;
  value: InterimHearingCollectionItemIds;
}

export interface DraftDirectionOrderCollection extends HasCaseDocument, UploadedApprovedOrderHolder {
  value: DraftDirectionOrder;
}

export interface DraftDirectionOrder extends HasCaseDocument, HasUploadingDocuments, UploadedApprovedOrder {
  purposeOfDocument: string;
  uploadDraftDocument: CaseDocument;
}

export interface DraftDirectionDetailsCollection {
  value: DraftDirectionDetailsHolder;
}

export interface GeneralLetterCollection extends HasCaseDocument {
  value: GeneralLetter;
}

export interface GeneralEmailCollection extends HasCaseDocument {
  value: GeneralEmailHolder;
}

export interface UploadConsentOrderCollection extends HasCaseDocument {
  value: UploadConsentOrder;
}

export interface VariationDocumentTypeCollection extends HasCaseDocument {
  id: string;
  value: VariationDocumentType;
}

export interface ConsentInContestedApprovedOrderCollection extends HasCaseDocument {
  id: string;
  value: ConsentInContestedApprovedOrder;
}

export interface UnapprovedOrderCollection extends HasCaseDocument {
  id: string;
  value: UnapproveOrder;
}

export interface ApprovedOrderConsolidateCollection extends HasCaseDocument {
  value: ApproveOrdersHolder;
}

export interface ApprovedOrderCollection extends HasCaseDocument {
  id: string;
  value: ApproveOrder;
}

export interface ManageScannedDocument extends HasCaseDocument {
  selectForUpdate: YesOrNo;
  caseDocuments: CaseDocument;
  caseDocumentType: CaseDocumentType;
  caseDocumentParty: CaseDocumentParty;
  caseDocumentOther: string;
  caseDocumentConfidentiality: YesOrNo;
  hearingDetails: string;
  caseDocumentFdr: YesOrNo;
  caseDocumentUploadDateTime: DateAsString;
  fileName: string;
  scannedFileName: string;
  scannedDate: DateAsString;
  exceptionRecordReference: string;
}

export interface BarristerCollectionItem extends CollectionElement<Barrister> {
  value: Barrister;
}

export interface SendOrderDocuments extends HasCaseDocument {
  bulkPrintDocument: CaseDocument;
}

export interface ChildDetailsCollectionElement extends CollectionElement<ChildDetails> {
  value: ChildDetails;
}

export interface ConsentedHearingDataElement extends HasCaseDocument {
  hearingType: string;
  hearingTimeEstimate: string;
  hearingDate: string;
  hearingTime: string;
  regionList: string;
  midlandsFRCList: string;
  londonFRCList: string;
  northWestFRCList: string;
  northEastFRCList: string;
  southEastFRCList: string;
  southWestFRCList: string;
  walesFRCList: string;
  highCourtFRCList: string;
  nottinghamCourtList: string;
  cfcCourtList: string;
  birminghamCourtList: string;
  liverpoolCourtList: string;
  manchesterCourtList: string;
  lancashireCourtList: string;
  cleavelandCourtList: string;
  nwyorkshireCourtList: string;
  humberCourtList: string;
  kentSurreyCourtList: string;
  bedfordshireCourtList: string;
  thamesvalleyCourtList: string;
  devonCourtList: string;
  dorsetCourtList: string;
  bristolCourtList: string;
  newportCourtList: string;
  swanseaCourtList: string;
  northWalesCourtList: string;
  highCourtList: string;
  additionalInformationAboutHearing: string;
  promptForAnyDocument: string;
  uploadAdditionalDocument: CaseDocument;
  hearingNotice: CaseDocument;
}

export interface CaseFlag {
  partyName: string;
  roleOnCase: string;
  details: FlagDetailData[];
}

export interface DynamicListElement {
  code: string;
  label: string;
}

export interface OrderSummary {
  PaymentReference: string;
  PaymentTotal: string;
  Fees: FeeItem[];
}

export interface AccessCodeEntry {
  accessCode: string;
  createdAt: DateAsString;
  validUntil: DateAsString;
  isValid: YesOrNo;
}

export interface OtherDocument extends HasCaseDocument {
  typeOfDocument: OtherDocumentType;
  uploadedDocument: CaseDocument;
}

export interface RepresentationUpdate {
  party: string;
  name: string;
  date: DateAsString;
  by: string;
  via: string;
  added: ChangedRepresentative;
  removed: ChangedRepresentative;
}

export interface PropertyAdjustmentOrder {
  nameForProperty: string;
  propertAddress: string;
}

export interface IntervenerWrapper extends IntervenerDetails {
  solUserId: string;
  intervenerLabel: string;
  intervenerType: IntervenerType;
  addIntervenerCode: string;
  addIntervenerValue: string;
  intervenerHearingNoticesCollectionName: IntervenerHearingNoticeCollectionName;
  deleteIntervenerCode: string;
  deleteIntervenerValue: string;
  updateIntervenerValue: string;
  intervenerSolicitorCaseRole: CaseRole;
  paperNotificationRecipient: PaperNotificationRecipient;
}

export interface HasUploadingDocuments {
  uploadingDocuments: CaseDocument[];
}

export interface Court extends CourtListWrapper {
  region: Region;
  midlandsList: RegionMidlandsFrc;
  londonList: RegionLondonFrc;
  northWestList: RegionNorthWestFrc;
  northEastList: RegionNorthEastFrc;
  southEastList: RegionSouthEastFrc;
  southWestList: RegionSouthWestFrc;
  walesList: RegionWalesFrc;
  hcCourtList: RegionHighCourtFrc;
  nottinghamCourtList: NottinghamCourt;
  cfcCourtList: CfcCourt;
  birminghamCourtList: BirminghamCourt;
  londonCourtList: LondonCourt;
  liverpoolCourtList: LiverpoolCourt;
  manchesterCourtList: ManchesterCourt;
  lancashireCourtList: LancashireCourt;
  cleavelandCourtList: ClevelandCourt;
  clevelandCourtList: ClevelandCourt;
  humberCourtList: HumberCourt;
  kentSurreyCourtList: KentSurreyCourt;
  bedfordshireCourtList: BedfordshireCourt;
  devonCourtList: DevonCourt;
  dorsetCourtList: DorsetCourt;
  bristolCourtList: BristolCourt;
  newportCourtList: NewportCourt;
  swanseaCourtList: SwanseaCourt;
  northWalesCourtList: NorthWalesCourt;
  highCourtList: HighCourt;
  nwyorkshireCourtList: NwYorkshireCourt;
  thamesvalleyCourtList: ThamesValleyCourt;
}

export interface HearingCourtWrapper extends CourtListWrapper {
  hearing_nottinghamCourtList: NottinghamCourt;
  hearing_cfcCourtList: CfcCourt;
  hearing_birminghamCourtList: BirminghamCourt;
  hearing_liverpoolCourtList: LiverpoolCourt;
  hearing_manchesterCourtList: ManchesterCourt;
  hearing_lancashireCourtList: LancashireCourt;
  hearing_cleavelandCourtList: ClevelandCourt;
  hearing_nwyorkshireCourtList: NwYorkshireCourt;
  hearing_humberCourtList: HumberCourt;
  hearing_kentSurreyCourtList: KentSurreyCourt;
  hearing_bedfordshireCourtList: BedfordshireCourt;
  hearing_thamesvalleyCourtList: ThamesValleyCourt;
  hearing_devonCourtList: DevonCourt;
  hearing_dorsetCourtList: DorsetCourt;
  hearing_bristolCourtList: BristolCourt;
  hearing_newportCourtList: NewportCourt;
  hearing_swanseaCourtList: SwanseaCourt;
  hearing_northWalesCourtList: NorthWalesCourt;
  hearing_highCourtList: HighCourt;
}

export interface AdditionalHearingDocument extends HasCaseDocument {
  additionalHearingDocument: CaseDocument;
  additionalHearingDocumentDate: DateAsString;
}

export interface WithAttachments {
  attachments: DocumentCollectionItem[];
}

export interface UploadedApprovedOrder {
  approvedOrder: CaseDocument;
  additionalDocuments: DocumentCollectionItem[];
}

export interface HearingBundleDocumentCollection {
  value: HearingBundleDocument;
}

export interface OrderToShareCollection {
  value: OrderToShare;
}

export interface UploadCaseDocument extends HasCaseDocument {
  caseDocuments: CaseDocument;
  caseDocumentType: CaseDocumentType;
  caseDocumentParty: CaseDocumentParty;
  caseDocumentOther: string;
  caseDocumentConfidentiality: YesOrNo;
  hearingDetails: string;
  caseDocumentFdr: YesOrNo;
  caseDocumentUploadDateTime: DateAsString;
  fileName: string;
  scannedFileName: string;
  scannedDate: DateAsString;
  exceptionRecordReference: string;
  selectForUpdate: YesOrNo;
}

export interface Hearing extends HearingLike {}

export interface VacateOrAdjournedHearing extends HearingLike {
  wasVacOrAdjNoticeSent: YesOrNo;
  vacatedOrAdjournedDate: DateAsString;
  vacateOrAdjournReason: VacateOrAdjournReason;
  specifyOtherReason: string;
  hearingStatus: VacateOrAdjournAction;
}

export interface ManageHearingDocument {
  hearingId: string;
  hearingCaseDocumentType: CaseDocumentType;
  hearingDocument: CaseDocument;
}

export interface HearingTabItem {
  tabHearingType: string;
  tabCourtSelection: string;
  tabAttendance: string;
  tabDateTime: string;
  tabTimeEstimate: string;
  tabConfidentialParties: string;
  tabAdditionalInformation: string;
  tabHearingDocuments: DocumentCollectionItem[];
  tabWasMigrated: YesOrNo;
}

export interface VacatedOrAdjournedHearingTabItem {
  tabHearingType: string;
  tabCourtSelection: string;
  tabAttendance: string;
  tabDateTime: string;
  tabTimeEstimate: string;
  tabConfidentialParties: string;
  tabAdditionalInformation: string;
  tabHearingDocuments: DocumentCollectionItem[];
  tabWasMigrated: YesOrNo;
  tabVacatedOrAdjournedDate: string;
  tabVacateOrAdjournReason: string;
  tabSpecifyOtherReason: string;
  tabHearingStatus: string;
}

export interface UploadSuggestedDraftOrderCollection {
  value: SuggestedUploadedDraftOrder;
}

export interface SuggestedPensionSharingAnnexCollection extends HasCaseDocument {
  value: SuggestedPensionSharingAnnex;
}

export interface UploadAgreedDraftOrderCollection {
  value: AgreedUploadedDraftOrder;
}

export interface AgreedPensionSharingAnnexCollection {
  value: AgreedPensionSharingAnnex;
}

export interface DraftOrdersReview extends HasCaseDocument {
  hearingType: string;
  hearingDate: DateAsString;
  hearingTime: string;
  hearingJudge: string;
  draftOrderDocReviewCollection: DraftOrderDocReviewCollection[];
  psaDocReviewCollection: PsaDocReviewCollection[];
}

export interface RefusedOrder extends HasCaseDocument {
  refusedDocument: CaseDocument;
  refusalOrder: CaseDocument;
  refusedDate: DateAsString;
  submittedDate: DateAsString;
  submittedBy: string;
  submittedByEmail: string;
  orderFiledBy: OrderFiledBy;
  attachments: DocumentCollectionItem[];
  refusalJudge: string;
  judgeFeedback: string;
  hearingDate: DateAsString;
  judgeType: JudgeType;
}

export interface AgreedDraftOrder extends HasCaseDocument, HasSubmittedInfo, Approvable, WithAttachments {
  draftOrder: CaseDocument;
  pensionSharingAnnex: CaseDocument;
  submittedBy: string;
  submittedByEmail: string;
  submittedDate: DateAsString;
  resubmission: YesOrNo;
}

export interface HasApprovable {
  value: Approvable;
}

export interface SuggestedDraftOrder extends HasCaseDocument, HasSubmittedInfo {
  draftOrder: CaseDocument;
  pensionSharingAnnex: CaseDocument;
  submittedBy: string;
  submittedByEmail: string;
  submittedDate: DateAsString;
  attachments: DocumentCollectionItem[];
}

export interface AnotherHearingRequestCollection {
  value: AnotherHearingRequest;
}

export interface FinalisedOrder extends HasCaseDocument, WithAttachments {
  finalisedDocument: CaseDocument;
  coverLetter: CaseDocument;
  submittedBy: string;
  submittedDate: DateAsString;
  approvalDate: DateAsString;
  approvalJudge: string;
  finalOrder: YesOrNo;
}

export interface DefaultCourtListWrapper extends CourtListWrapper {
  nottinghamCourtList: NottinghamCourt;
  cfcCourtList: CfcCourt;
  birminghamCourtList: BirminghamCourt;
  londonCourtList: LondonCourt;
  liverpoolCourtList: LiverpoolCourt;
  manchesterCourtList: ManchesterCourt;
  lancashireCourtList: LancashireCourt;
  cleavelandCourtList: ClevelandCourt;
  clevelandCourtList: ClevelandCourt;
  humberCourtList: HumberCourt;
  kentSurreyCourtList: KentSurreyCourt;
  bedfordshireCourtList: BedfordshireCourt;
  devonCourtList: DevonCourt;
  dorsetCourtList: DorsetCourt;
  bristolCourtList: BristolCourt;
  newportCourtList: NewportCourt;
  swanseaCourtList: SwanseaCourt;
  northWalesCourtList: NorthWalesCourt;
  highCourtList: HighCourt;
  nwyorkshireCourtList: NwYorkshireCourt;
  thamesvalleyCourtList: ThamesValleyCourt;
}

export interface InterimCourtListWrapper extends CourtListWrapper {
  interim_nottinghamCourtList: NottinghamCourt;
  interim_cfcCourtList: CfcCourt;
  interim_birminghamCourtList: BirminghamCourt;
  interim_liverpoolCourtList: LiverpoolCourt;
  interim_manchesterCourtList: ManchesterCourt;
  interim_lancashireCourtList: LancashireCourt;
  interim_cleavelandCourtList: ClevelandCourt;
  interim_nwyorkshireCourtList: NwYorkshireCourt;
  interim_humberCourtList: HumberCourt;
  interim_kentSurreyCourtList: KentSurreyCourt;
  interim_bedfordshireCourtList: BedfordshireCourt;
  interim_thamesvalleyCourtList: ThamesValleyCourt;
  interim_devonCourtList: DevonCourt;
  interim_dorsetCourtList: DorsetCourt;
  interim_bristolCourtList: BristolCourt;
  interim_newportCourtList: NewportCourt;
  interim_swanseaCourtList: SwanseaCourt;
  interim_northWalesCourtList: NorthWalesCourt;
  interim_highCourtList: HighCourt;
}

export interface GeneralApplicationCourtListWrapper extends CourtListWrapper {
  generalApplicationDirections_nottinghamCourtList: NottinghamCourt;
  generalApplicationDirections_cfcCourtList: CfcCourt;
  generalApplicationDirections_birminghamCourtList: BirminghamCourt;
  generalApplicationDirections_liverpoolCourtList: LiverpoolCourt;
  generalApplicationDirections_manchesterCourtList: ManchesterCourt;
  generalApplicationDirections_lancashireCourtList: LancashireCourt;
  generalApplicationDirections_cleavelandCourtList: ClevelandCourt;
  generalApplicationDirections_nwyorkshireCourtList: NwYorkshireCourt;
  generalApplicationDirections_humberCourtList: HumberCourt;
  generalApplicationDirections_kentSurreyCourtList: KentSurreyCourt;
  generalApplicationDirections_bedfordshireCourtList: BedfordshireCourt;
  generalApplicationDirections_thamesvalleyCourtList: ThamesValleyCourt;
  generalApplicationDirections_devonCourtList: DevonCourt;
  generalApplicationDirections_dorsetCourtList: DorsetCourt;
  generalApplicationDirections_bristolCourtList: BristolCourt;
  generalApplicationDirections_newportCourtList: NewportCourt;
  generalApplicationDirections_swanseaCourtList: SwanseaCourt;
  generalApplicationDirections_northWalesCourtList: NorthWalesCourt;
  generalApplicationDirections_highCourtList: HighCourt;
}

export interface GeneralApplicationItems extends HasCaseDocument {
  generalApplicationDocument: CaseDocument;
  generalApplicationCreatedBy: string;
  generalApplicationDraftOrder: CaseDocument;
  generalApplicationReceivedFrom: string;
  generalApplicationSender: DynamicRadioList;
  appRespGeneralApplicationReceivedFrom: string;
  generalApplicationTimeEstimate: string;
  generalApplicationHearingRequired: string;
  generalApplicationSpecialMeasures: string;
  generalApplicationCreatedDate: DateAsString;
  gaSupportDocuments: GeneralApplicationSupportingDocumentData[];
  generalApplicationStatus: string;
  generalApplicationOutcomeOther: string;
  generalApplicationDirectionsDocument: CaseDocument;
  hearingDetailsForGeneralApplication: HearingTabItem;
}

export interface GeneralApplication extends HasCaseDocument {
  generalApplicationDocument: CaseDocument;
}

export interface ContestedGeneralOrder extends HasCaseDocument {
  generalOrderText: string;
  additionalDocument: CaseDocument;
  dateOfOrder: DateAsString;
  additionalComments: string;
  selectJudge: string;
  generalOrder_addressTo: string;
}

export interface GeneralOrder extends HasCaseDocument {
  generalOrderText: string;
  generalOrder_addressTo: string;
  generalOrder_order: string;
  generalOrder_documentUpload: CaseDocument;
  generalOrder_judgeList: JudgeType;
  generalOrder_judgeName: string;
  generalOrder_dateOfOrder: DateAsString;
  generalOrder_comments: string;
}

export interface DirectionDetailInterim {
  localCourt: Court;
  nottinghamList: NottinghamCourt;
  cfcList: CfcCourt;
  interimTypeOfHearing: InterimTypeOfHearing;
  interimTimeEstimate: string;
  interimDateOfHearing: DateAsString;
  interimHearingTime: string;
  isAnotherHearingYN: YesOrNo;
}

export interface InterimHearingItem extends HasCaseDocument {
  interimHearingDate: DateAsString;
  interimHearingTime: string;
  interimHearingType: InterimTypeOfHearing;
  interimPromptForAnyDocument: YesOrNo;
  interimHearingTimeEstimate: string;
  interimUploadAdditionalDocument: CaseDocument;
  interimAdditionalInformationAboutHearing: string;
  interim_regionList: Region;
  interim_midlandsFRCList: RegionMidlandsFrc;
  interim_londonFRCList: RegionLondonFrc;
  interim_northWestFRCList: RegionNorthWestFrc;
  interim_northEastFRCList: RegionNorthEastFrc;
  interim_southEastFRCList: RegionSouthEastFrc;
  interim_southWestFRCList: RegionSouthWestFrc;
  interim_walesFRCList: RegionWalesFrc;
  interim_highCourtFRCList: RegionHighCourtFrc;
  interim_nottinghamCourtList: NottinghamCourt;
  interim_cfcCourtList: CfcCourt;
  interim_birminghamCourtList: BirminghamCourt;
  interim_liverpoolCourtList: LiverpoolCourt;
  interim_manchesterCourtList: ManchesterCourt;
  interim_lancashireCourtList: LancashireCourt;
  interim_cleavelandCourtList: ClevelandCourt;
  interim_nwyorkshireCourtList: NwYorkshireCourt;
  interim_humberCourtList: HumberCourt;
  interim_kentSurreyCourtList: KentSurreyCourt;
  interim_bedfordshireCourtList: BedfordshireCourt;
  interim_thamesvalleyCourtList: ThamesValleyCourt;
  interim_devonCourtList: DevonCourt;
  interim_dorsetCourtList: DorsetCourt;
  interim_bristolCourtList: BristolCourt;
  interim_newportCourtList: NewportCourt;
  interim_swanseaCourtList: SwanseaCourt;
  interim_northWalesCourtList: NorthWalesCourt;
  interim_highCourtList: HighCourt;
}

export interface InterimHearingBulkPrintDocument extends HasCaseDocument {
  bulkprintDocument: CaseDocument;
}

export interface InterimHearingCollectionItemIds {
  ihItemIds: string;
}

export interface DraftDirectionDetailsHolder {
  isThisFinalYN: YesOrNo;
  isAnotherHearingYN: YesOrNo;
  typeOfHearing: HearingTypeDirection;
  timeEstimate: HearingTimeDirection;
  additionalTime: string;
  localCourt: Court;
  nottinghamList: NottinghamCourt;
  cfcList: CfcCourt;
  listingInstructor: string;
}

export interface GeneralLetter extends HasCaseDocument {
  generatedLetter: CaseDocument;
  generalLetterUploadedDocument: CaseDocument;
  generalLetterUploadedDocuments: DocumentCollectionItem[];
}

export interface GeneralEmailHolder extends HasCaseDocument {
  generalEmailRecipient: string;
  generalEmailCreatedBy: string;
  generalEmailBody: string;
  generalEmailUploadedDocument: CaseDocument;
  generalEmailDateSent: DateAsString;
}

export interface UploadConsentOrder extends HasCaseDocument {
  DocumentType: ConsentOrderType;
  DocumentEmailContent: string;
  DocumentLink: CaseDocument;
  DocumentDateAdded: DateAsString;
  DocumentComment: string;
  DocumentFileName: string;
}

export interface VariationDocumentType extends HasCaseDocument {
  typeOfDocument: VariationTypeOfDocument;
  uploadedDocument: Document;
}

export interface ConsentInContestedApprovedOrder extends HasCaseDocument {
  orderReceivedAt: DateAsString;
  orderLetter: CaseDocument;
  consentOrder: CaseDocument;
  pensionDocuments: PensionTypeCollection[];
  additionalConsentDocuments: DocumentCollectionItem[];
}

export interface UnapproveOrder extends HasCaseDocument {
  orderReceivedAt: DateAsString;
  unapproveOrder: CaseDocument;
  additionalConsentDocuments: DocumentCollectionItem[];
}

export interface ApproveOrdersHolder extends HasCaseDocument {
  orderReceivedAt: DateAsString;
  approveOrders: ApprovedOrderCollection[];
}

export interface ApproveOrder extends HasCaseDocument {
  orderReceivedAt: DateAsString;
  approveOrder: CaseDocument;
}

export interface Barrister {
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  Organisation: Organisation;
}

export interface ChildDetails {
  childFullname: string;
  childDateOfBirth: DateAsString;
  childGender: Gender;
  childApplicantRelation: ChildRelation;
  childApplicantRelationOther: string;
  childRespondentRelation: ChildRelation;
  childRespondentRelationOther: string;
  childrenLivesInEnglandOrWales: YesOrNo;
}

export interface FlagDetailData {
  id: string;
  value: FlagDetail;
}

export interface FeeItem {
  value: FeeValue;
}

export interface ChangedRepresentative {
  name: string;
  email: string;
  organisation: Organisation;
}

export interface IntervenerDetails {
  intervenerSolEmail: string;
  intervenerName: string;
  intervenerAddress: Address;
  intervenerEmail: string;
  intervenerPhone: string;
  intervenerDateAdded: DateAsString;
  intervenerSolName: string;
  intervenerSolPhone: string;
  intervenerInRefuge: YesOrNo;
  intervenerResideOutsideUK: YesOrNo;
  intervenerRepresented: YesOrNo;
  intervenerSolicitorFirm: string;
  intervenerOrganisation: OrganisationPolicy;
  intervenerSolicitorReference: string;
  intervenerAddressConfidential: YesOrNo;
}

export interface CourtListWrapper {
  nottinghamCourt: NottinghamCourt;
  birminghamCourt: BirminghamCourt;
  clevelandCourt: ClevelandCourt;
  nwYorkshireCourt: NwYorkshireCourt;
  manchesterCourt: ManchesterCourt;
  lancashireCourt: LancashireCourt;
  liverpoolCourt: LiverpoolCourt;
  bristolCourt: BristolCourt;
  bedfordshireCourt: BedfordshireCourt;
  kentSurreyCourt: KentSurreyCourt;
  thamesValleyCourt: ThamesValleyCourt;
  northWalesCourt: NorthWalesCourt;
  newportCourt: NewportCourt;
  swanseaCourt: SwanseaCourt;
  cfcCourt: CfcCourt;
  highCourt: HighCourt;
  humberCourt: HumberCourt;
  devonCourt: DevonCourt;
  dorsetCourt: DorsetCourt;
}

export interface HearingBundleDocument {
  bundleDocuments: CaseDocument;
  bundleUploadDate: DateAsString;
}

export interface OrderToShare extends DocumentIdProvider {
  documentName: string;
  documentToShare: YesOrNo;
  hasSupportingDocuments: YesOrNo;
  includeSupportingDocument: Yes[];
  attachmentsToShare: AttachmentToShareCollection[];
  coverLetterToShare: CoverLetterToShare;
}

export interface PartyOnCaseCollectionItem {
  value: PartyOnCase;
}

export interface HearingLike {
  partiesOnCase: PartyOnCaseCollectionItem[];
  hearingTimeEstimate: string;
  hearingNoticePrompt: YesOrNo;
  hearingType: HearingType;
  hearingDate: DateAsString;
  hearingTime: string;
  hearingMode: HearingMode;
  wasMigrated: YesOrNo;
  additionalHearingDocPrompt: YesOrNo;
  additionalHearingDocs: DocumentCollectionItem[];
  hearingCourtSelection: Court;
  additionalHearingInformation: string;
}

export interface SuggestedUploadedDraftOrder extends HasUploadingDocuments {
  suggestedDraftOrderDocument: CaseDocument;
  additionalDocuments: AdditionalDocumentsCollection[];
}

export interface SuggestedPensionSharingAnnex extends HasUploadingDocuments {
  suggestedPensionSharingAnnexes: CaseDocument;
}

export interface AgreedUploadedDraftOrder extends HasUploadingDocuments {
  agreedDraftOrderDocument: CaseDocument;
  resubmission: string[];
  additionalDocuments: AdditionalDocumentsCollection[];
}

export interface AgreedPensionSharingAnnex extends HasUploadingDocuments {
  agreedPensionSharingAnnexes: CaseDocument;
}

export interface DraftOrderDocReviewCollection extends HasCaseDocument, HasApprovable {
  value: DraftOrderDocumentReview;
}

export interface PsaDocReviewCollection extends HasCaseDocument, HasApprovable {
  value: PsaDocumentReview;
}

export interface HasSubmittedInfo {
  uploadedOnBehalfOf: string;
}

export interface Approvable extends DocumentMatcher {
  courtOrderDate: DateAsString;
  approvalDate: DateAsString;
  approvalJudge: string;
  targetDocument: CaseDocument;
  orderStatus: OrderStatus;
  finalOrder: YesOrNo;
  coverLetter: CaseDocument;
}

export interface AnotherHearingRequest {
  whichOrder: DynamicList;
  typeOfHearing: HearingType;
  timeEstimate: HearingTimeDirection;
  additionalTime: string;
  anyOtherListingInstructions: string;
}

export interface GeneralApplicationSupportingDocumentData extends HasCaseDocument {
  id: string;
  value: GeneralApplicationSuportingDocumentItems;
}

export interface CollectionElement<T> {
  id: string;
  value: T;
}

export interface Document extends DocumentFileNameProvider {
  document_url: string;
  document_binary_url: string;
  document_filename: string;
}

export interface FlagDetail {
  name: string;
  subTypeValue: string;
  subTypeKey: string;
  otherDescription: string;
  flagComment: string;
  dateTimeModified: DateAsString;
  dateTimeCreated: DateAsString;
  path: PathValue[];
  hearingRelevant: string;
  flagCode: string;
  status: string;
}

export interface FeeValue {
  FeeDescription: string;
  FeeVersion: string;
  FeeCode: string;
  FeeAmount: string;
}

export interface AttachmentToShareCollection {
  value: AttachmentToShare;
}

export interface CoverLetterToShare extends DocumentIdProvider {
  coverLetterName: string;
  coverLetterDocument: CaseDocument;
}

export interface DocumentIdProvider {
  documentId: string;
}

export interface PartyOnCase {
  role: string;
  label: string;
}

export interface AdditionalDocumentsCollection extends HasCaseDocument {
  value: UploadDraftOrderAdditionalDocument;
}

export interface DraftOrderDocumentReview
  extends HasCaseDocument,
    Reviewable,
    RefusalOrderConvertible,
    HearingInstructionProcessable {
  draftOrderDocument: CaseDocument;
  resubmission: YesOrNo;
  uploadedOnBehalfOf: string;
  attachments: DocumentCollectionItem[];
  anotherHearingToBeListed: YesOrNo;
  hearingType: string;
  hearingTimeEstimate: string;
  additionalTime: string;
  otherListingInstructions: string;
}

export interface PsaDocumentReview
  extends HasCaseDocument,
    Reviewable,
    RefusalOrderConvertible,
    HearingInstructionProcessable {
  psaDocument: CaseDocument;
  resubmission: YesOrNo;
  uploadedOnBehalfOf: string;
  anotherHearingToBeListed: YesOrNo;
  hearingType: string;
  hearingTimeEstimate: string;
  additionalTime: string;
  otherListingInstructions: string;
}

export interface DocumentMatcher {}

export interface GeneralApplicationSuportingDocumentItems extends HasCaseDocument {
  supportDocument: CaseDocument;
}

export interface PathValue {
  id: string;
  value: string;
}

export interface AttachmentToShare extends DocumentIdProvider {
  attachmentName: string;
  documentToShare: YesOrNo;
  attachment: CaseDocument;
}

export interface UploadDraftOrderAdditionalDocument {
  orderAttachment: CaseDocument;
}

export interface Reviewable {
  submittedDate: DateAsString;
  orderStatus: OrderStatus;
  notificationSentDate: DateAsString;
}

export interface RefusalOrderConvertible extends Approvable {
  submittedDate: DateAsString;
  refusedDocument: CaseDocument;
  submittedByEmail: string;
  orderFiledBy: OrderFiledBy;
  refusedDate: DateAsString;
  submittedBy: string;
}

export interface HearingInstructionProcessable extends DocumentMatcher {}

export type DateAsString = string;

export const enum State {
  CASE_ADDED = 'caseAdded',
  NEW_PAPER_CASE = 'newPaperCase',
  AWAITING_HWF_DECISION = 'awaitingHWFDecision',
  AWAITING_PAYMENT = 'awaitingPayment',
  AWAITING_PAYMENT_RESPONSE = 'awaitingPaymentResponse',
  APPLICATION_SUBMITTED = 'applicationSubmitted',
  APPLICATION_ISSUED = 'applicationIssued',
  REFERRED_TO_JUDGE = 'referredToJudge',
  ORDER_MADE = 'orderMade',
  CONSENT_ORDER_APPROVED = 'consentOrderApproved',
  CONSENT_ORDER_MADE = 'consentOrderMade',
  AWAITING_RESPONSE = 'awaitingResponse',
  RESPONSE_RECEIVED = 'responseReceived',
  AWAITING_INFO = 'awaitingInfo',
  INFO_RECEIVED = 'infoReceived',
  CLOSE = 'close',
  GATE_KEEPING_AND_ALLOCATION = 'gateKeepingAndAllocation',
  SCHEDULING_AND_HEARING = 'schedulingAndHearing',
  JUDGE_DRAFT_ORDER = 'judgeDraftOrder',
  SOLICITOR_DRAFT_ORDER = 'solicitorDraftOrder',
  REVIEW_ORDER = 'reviewOrder',
  DRAFT_ORDER_NOT_APPROVED = 'draftOrderNotApproved',
  SCHEDULE_RAISE_DIRECTIONS_ORDER = 'scheduleRaiseDirectionsOrder',
  ORDER_DRAWN = 'orderDrawn',
  ORDER_SENT = 'orderSent',
  CONSENTED_ORDER_SUBMITTED = 'consentedOrderSubmitted',
  AWAITING_JUDICIARY_RESPONSE_CONSENT = 'awaitingJudiciaryResponseConsent',
  CONSENTED_ORDER_ASSIGN_JUDGE = 'consentedOrderAssignJudge',
  CONSENTED_ORDER_APPROVED = 'consentedOrderApproved',
  CONSENTED_ORDER_NOT_APPROVED = 'consentedOrderNotApproved',
  GENERAL_APPLICATION = 'generalApplication',
  GENERAL_APPLICATION_AWAITING_JUDICIARY_RESPONSE = 'generalApplicationAwaitingJudiciaryResponse',
  GENERAL_APPLICATION_OUTCOME = 'generalApplicationOutcome',
  PREPARE_FOR_HEARING = 'prepareForHearing',
  CASE_FILE_SUBMITTED = 'caseFileSubmitted',
  CONSENT_PROCESS = 'consentProcess',
  CONSENT_ORDER_NOT_APPROVED = 'consentOrderNotApproved',
  AWAITING_JUDICIARY_RESPONSE = 'awaitingJudiciaryResponse',
  CASE_WORKER_REVIEW = 'caseWorkerReview',
  PAPER_CASE_ADDED = 'paperCaseAdded',
  READY_FOR_HEARING = 'readyForHearing',
  CASE_HIDDEN = 'caseHidden',
}

export const enum Classification {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  RESTRICTED = 'RESTRICTED',
}

export const enum CaseType {
  CONSENTED = 'FinancialRemedyMVP2',
  CONTESTED = 'FinancialRemedyContested',
  UNKNOWN = 'unknown',
}

export const enum StageReached {
  DECREE_NISI = 'Decree Nisi',
  DECREE_ABSOLUTE = 'Decree Absolute',
  PETITION_ISSUED = 'Petition Issued',
}

export const enum Provision {
  MATRIMONIAL_OR_CIVIL_PARTNERSHIP_PROCEEDINGS = 'matrimonialOrCivilPartnershipProceedings',
  CHILDREN_ACT_1989 = 'childrenAct1989',
}

export const enum Intention {
  APPLY_TO_COURT_FOR = 'ApplyToCourtFor',
  PROCEED_WITH_APPLICATION = 'ProceedWithApplication',
  APPLY_TO_VARY = 'ApplyToVary',
  APPLY_TO_DISCHARGE_PERIODICAL_PAYMENT_ORDER = 'ApplyToDischargePeriodicalPaymentOrder',
}

export const enum PeriodicalPaymentSubstitute {
  LUMP_SUM_ORDER = 'lumpSumOrder',
  PROPERTY_ADJUSTMENT_ORDER = 'propertyAdjustmentOrder',
  PENSION_SHARING_ORDER = 'pensionSharingOrder',
  PENSION_COMPENSATION_SHARING_ORDER = 'pensionCompensationSharingOrder',
}

export const enum YesOrNo {
  YES = 'Yes',
  NO = 'No',
}

export const enum OrderDirection {
  ORDER_ACCEPTED_AS_DRAFTED = 'Order Accepted as drafted',
  ORDER_ACCEPTED_AS_AMENDED = 'Order Accepted as amended',
  ORDER_ACCEPTED_WITH_CONDITIONS = 'Order Accepted with conditions',
}

export const enum PensionProvider {
  THE_COURT = 'theCourt',
  APPLICANT_SOLICITOR = 'applicantSolicitor',
  RESPONDENT_SOLICITOR = 'respondentSolicitor',
  OTHER = 'other',
}

export const enum JudgeType {
  DISTRICT_JUDGE = 'District Judge',
  DEPUTY_DISTRICT_JUDGE = 'Deputy District Judge',
  HIS_HONOUR_JUDGE = 'His Honour Judge',
  HER_HONOUR_JUDGE = 'Her Honour Judge',
  RECORDER = 'Recorder',
  PROPER_OFFICER_OF_THE_COURT = 'Proper Officer of the Court',
  THE_HONOURABLE_MR_JUSTICE = 'The Honourable Mr Justice',
  THE_HONOURABLE_MRS_JUSTICE = 'The Honourable Mrs Justice',
  THE_HONOURABLE_MS_JUSTICE = 'The Honourable Ms Justice',
}

export const enum AssignToJudgeReason {
  DRAFT_CONSENT_ORDER = 'Draft consent order',
  RESUBMITTED_DRAFT_CONSENT_ORDER = 'Resubmitted draft consent order',
  NEW_CASE_ACCEPTED_BY_JUDGE = 'New case accepted by Judge',
}

export const enum ApplicantRole {
  FR_ApplicantsRoleInDivorce_1 = 'FR_ApplicantsRoleInDivorce_1',
  FR_ApplicantsRoleInDivorce_2 = 'FR_ApplicantsRoleInDivorce_2',
}

export const enum ApplicantRepresentedPaper {
  FR_applicant_represented_1 = 'FR_applicant_represented_1',
  FR_applicant_represented_2 = 'FR_applicant_represented_2',
  FR_applicant_represented_3 = 'FR_applicant_represented_3',
}

export const enum AuthorisationSignedBy {
  APPLICANT = 'Applicant',
  LITIGATION_FRIEND = 'Litigation Friend',
  APPLICANT_SOLICITOR = "Applicant's solicitor",
}

export const enum BenefitPayment {
  BENEFIT_CHECKLIST_VALUE_1 = 'Step child or step children',
  BENEFIT_CHECKLIST_VALUE_2 = 'In addition to child support maintenance already paid under a Child Support Agency assessment',
  BENEFIT_CHECKLIST_VALUE_3 = 'To meet expenses arising from a child’s disability',
  BENEFIT_CHECKLIST_VALUE_4 = 'To meet expenses incurred by a child being in educated or training for work',
  BENEFIT_CHECKLIST_VALUE_5 = 'The child or the person with care of the child or the absent parent of the child is not habitually resident in the United Kingdom',
}

export const enum FastTrackReason {
  PERIODICAL_PAYMENTS_ORDER_NOT_SEEK_TO_DISMISS = 'reason_1',
  RECOGNITION_AND_ENFORCEMENT = 'reason_2',
  ORDER_FOR_PERIODICAL_PAYMENTS = 'reason_3',
  FINANCIAL_PROVISION = 'reason_4',
}

export const enum Complexity {
  TRUE_YES = 'trueYes',
  FALSE_NO = 'falseNo',
  TRUE_DONT_KNOW = 'trueDontKnow',
}

export const enum EstimatedAsset {
  UNABLE_TO_QUANTIFY = 'estimatedAssetsChecklist_1',
  UNDER_ONE_MILLION = 'estimatedAssetsChecklist_2',
  ONE_TO_FIVE_MILLION = 'estimatedAssetsChecklist_3',
  FIVE_TO_TEN_MILLION = 'estimatedAssetsChecklist_4',
  OVER_TEN_MILLION = 'estimatedAssetsChecklist_5',
}

export const enum EstimatedAssetV2 {
  OVER_FIFTEEN_MILLION_POUNDS = 'overFifteenMillionPounds',
  BETWEEN_SEVEN_POINT_FIVE_TO_FIFTEEN_MILLION_POUNDS = 'betweenSevenPointFiveAndFifteenMillionPounds',
  BETWEEN_ONE_TO_SEVEN_POINT_FIVE_MILLION_POUNDS = 'betweenOneAndSevenPointFiveMillionPounds',
  UNDER_ONE_MILLION_POUNDS = 'underOneMillionPounds',
  UNDER_TWO_HUNDRED_AND_FIFTY_THOUSAND_POUNDS = 'underTwoHundredAndFiftyThousandPounds',
  UNABLE_TO_QUANTIFY = 'unableToQuantify',
}

export const enum PotentialAllegation {
  POTENTIAL_ALLEGATION_CHECKLIST_1 = 'potentialAllegationChecklist_1',
  POTENTIAL_ALLEGATION_CHECKLIST_2 = 'potentialAllegationChecklist_2',
  POTENTIAL_ALLEGATION_CHECKLIST_3 = 'potentialAllegationChecklist_3',
  POTENTIAL_ALLEGATION_CHECKLIST_4 = 'potentialAllegationChecklist_4',
  POTENTIAL_ALLEGATION_CHECKLIST_5 = 'potentialAllegationChecklist_5',
  POTENTIAL_ALLEGATION_CHECKLIST_6 = 'potentialAllegationChecklist_6',
  POTENTIAL_ALLEGATION_CHECKLIST_7 = 'potentialAllegationChecklist_7',
  POTENTIAL_ALLEGATION_CHECKLIST_8 = 'potentialAllegationChecklist_8',
  POTENTIAL_ALLEGATION_CHECKLIST_9 = 'potentialAllegationChecklist_9',
  POTENTIAL_ALLEGATION_CHECKLIST_10 = 'potentialAllegationChecklist_10',
  POTENTIAL_ALLEGATION_CHECKLIST_11 = 'potentialAllegationChecklist_11',
  POTENTIAL_ALLEGATION_CHECKLIST_12 = 'potentialAllegationChecklist_12',
  POTENTIAL_ALLEGATION_CHECKLIST_13 = 'potentialAllegationChecklist_13',
  POTENTIAL_ALLEGATION_CHECKLIST_14 = 'potentialAllegationChecklist_14',
  NOT_APPLICABLE = 'notApplicable',
}

export const enum JudgeAllocated {
  FR_JUDGE_ALLOCATED_LIST_1 = 'FR_judgeAllocatedList_1',
  FR_JUDGE_ALLOCATED_LIST_2 = 'FR_judgeAllocatedList_2',
  FR_JUDGE_ALLOCATED_LIST_3 = 'FR_judgeAllocatedList_3',
}

export const enum JudgeTimeEstimate {
  STANDARD_TIME = 'standardTime',
  ADDITIONAL_TIME = 'additionalTime',
}

export const enum SolicitorToDraftOrder {
  APPLICANT_SOLICITOR = 'applicantSolicitor',
  RESPONDENT_SOLICITOR = 'respondentSolicitor',
}

export const enum CaseRole {
  APP_SOLICITOR = '[APPSOLICITOR]',
  APP_BARRISTER = '[APPBARRISTER]',
  RESP_SOLICITOR = '[RESPSOLICITOR]',
  RESP_BARRISTER = '[RESPBARRISTER]',
  CASEWORKER = '[CASEWORKER]',
  CREATOR = '[CREATOR]',
  INTVR_SOLICITOR_1 = '[INTVRSOLICITOR1]',
  INTVR_SOLICITOR_2 = '[INTVRSOLICITOR2]',
  INTVR_SOLICITOR_3 = '[INTVRSOLICITOR3]',
  INTVR_SOLICITOR_4 = '[INTVRSOLICITOR4]',
  INTVR_BARRISTER_1 = '[INTVRBARRISTER1]',
  INTVR_BARRISTER_2 = '[INTVRBARRISTER2]',
  INTVR_BARRISTER_3 = '[INTVRBARRISTER3]',
  INTVR_BARRISTER_4 = '[INTVRBARRISTER4]',
  APPLICANT = '[APPLICANT]',
  RESPONDENT = '[RESPONDENT]',
}

export const enum BarristerParty {
  APPLICANT = 'applicant',
  RESPONDENT = 'respondent',
  INTERVENER1 = 'intervener1',
  INTERVENER2 = 'intervener2',
  INTERVENER3 = 'intervener3',
  INTERVENER4 = 'intervener4',
}

export const enum BenefitPaymentChecklist {
  STEP_CHILD_OR_STEP_CHILDREN = 'Step child or step children',
  IN_ADDITION_TO_CHILD_SUPPORT_MAINTENANCE_ALREADY_PAID = 'In addition to child support maintenance already paid under a Child Support Agency assessment',
  EXPENSES_ARISING_FROM_A_CHILDS_DISABILITY = 'To meet expenses arising from a child’s disability',
  EXPENSES_INCURRED_BY_A_CHILD_BEING_IN_EDUCATED_OR_TRAINING_FOR_WORK = 'To meet expenses incurred by a child being in educated or training for work',
  NOT_HABITUALLY_RESIDENT_IN_THE_UNITED_KINGDOM = 'The child or the person with care of the child or the absent parent of the child is not habitually resident in the United Kingdom',
}

export const enum ScannedDocumentTypeOption {
  APPLICANT_DOCUMENT = 'applicantDoc',
  RESPONDENT_DOCUMENT = 'respondentDoc',
}

export const enum OrderRefusalOption {
  INSUFFICIENT_INFO_A = 'Insufficient information provided – A',
  INSUFFICIENT_INFO_B = 'Insufficient information provided – B',
  INSUFFICIENT_INFO_C = 'Insufficient information provided – C',
  INSUFFICIENT_INFO_D = 'Insufficient information provided – D',
  INSUFFICIENT_INFO_E = 'Insufficient information provided – E',
  PENSION_ANNEX = 'Pension annex',
  RESPONDENT_INDEPENDENT_LEGAL_ADVICE = 'Respondent – independent legal advice',
  D81_INCOMPLETE = 'The D81 incomplete',
  HEARING_FIXED_FOR_FIRST_AVAILABLE_DATE = 'Hearing fixed for first available date',
  TRANSFERRED_TO_APPLICANTS_HOME_COURT_OLD = 'Transferred to Applicant’s home Court',
  TRANSFERRED_TO_APPLICANTS_HOME_COURT = "Transferred to Applicant's home Court",
  TRANSFERRED_TO_APPLICANTS_HOME_COURT_A = 'Transferred to Applicant home Court - A',
  TRANSFERRED_TO_APPLICANTS_HOME_COURT_B = 'Transferred to Applicant home Court - B',
  ORDER_DOES_NOT_APPEAR_FAIR = 'Order does not appear fair',
  PROVIDE_PENSION_VALUES_PROPERTY = 'Provide pension values/property',
  APPLICATION_FOR_VARIATION_ORDER_RECONSIDERED = 'Application for a consent/variation order reconsidered',
  OTHER_PLEASE_SPECIFY = 'Other (please specify)',
}

export const enum HearingTypeDirection {
  FDA = 'First Directions Appointment (FDA)',
  FDR = 'Financial Dispute Resolution (FDR)',
  FH = 'Final Hearing (FH)',
  DIR = 'Directions (DIR)',
}

export const enum SendOrderEventPostStateOption {
  PREPARE_FOR_HEARING = 'prepareForHearing',
  CLOSE = 'close',
  ORDER_SENT = 'orderSent',
  NONE = '',
}

export const enum ChangeOrganisationApprovalStatus {
  PENDING = '0',
  APPROVED = '1',
  REJECTED = '2',
}

export const enum ManageCaseDocumentsAction {
  ADD_NEW = 'Add_new',
  AMEND = 'Amend',
}

export const enum ManageHearingsAction {
  ADD_HEARING = 'Add_Hearing',
  ADJOURN_OR_VACATE_HEARING = 'Vacate_Hearing',
}

export const enum ExpressCaseParticipation {
  ENROLLED = 'Enrolled',
  DOES_NOT_QUALIFY = 'Does not qualify',
  WITHDRAWN = 'Withdrawn',
}

export const enum LabelForExpressCaseAmendment {
  SUITABLE_FOR_EXPRESS_LABEL = 'suitableForExpressCaseAmendmentLabel',
  UNSUITABLE_FOR_EXPRESS_LABEL = 'unsuitableForExpressCaseAmendmentLabel',
  SHOW_NEITHER_PAGE_NOR_LABEL = 'noLabel',
}

export const enum ScannedDocumentType {
  CHERISHED = 'cherished',
  OTHER = 'other',
  FORM = 'form',
  COVERSHEET = 'coversheet',
}

export const enum NoticeOfChangeParty {
  APPLICANT = 'applicant',
  RESPONDENT = 'respondent',
}

export const enum ApplicantAndRespondentEvidenceParty {
  APPLICANT = 'applicant',
  RESPONDENT = 'respondent',
}

export const enum GeneralApplicationOutcome {
  APPROVED = 'Approved',
  NOT_APPROVED = 'Not Approved',
  OTHER = 'Other',
}

export const enum GeneralOrderAddressTo {
  APPLICANT = 'applicant',
  APPLICANT_SOLICITOR = 'applicantSolicitor',
  RESPONDENT_SOLICITOR = 'respondentSolicitor',
}

export const enum InterimTypeOfHearing {
  MPS = 'Maintenance Pending Suit (MPS)',
  FDA = 'First Directions Appointment (FDA)',
  FDR = 'Financial Dispute Resolution (FDR)',
  FH = 'Final Hearing (FH)',
  DIR = 'Directions (DIR)',
}

export const enum GeneralLetterAddressToType {
  APPLICANT_SOLICITOR = 'applicantSolicitor',
  RESPONDENT_SOLICITOR = 'respondentSolicitor',
  RESPONDENT = 'respondent',
  OTHER = 'other',
  APPLICANT = 'applicant',
}

export const enum MiamExemption {
  DOMESTIC_VIOLENCE = 'domesticViolence',
  URGENCY = 'urgency',
  PREVIOUS_MIAM_ATTENDANCE = 'previousMIAMattendance',
  OTHER = 'other',
}

export const enum MiamDomesticViolence {
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_1 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_1',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_2 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_2',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_3 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_3',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_4 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_4',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_5 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_5',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_6 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_6',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_7 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_7',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_8 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_8',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_9 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_9',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_10 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_10',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_11 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_11',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_12 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_12',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_13 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_13',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_14 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_14',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_15 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_15',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_16 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_16',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_17 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_17',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_18 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_18',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_19 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_19',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_20 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_20',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_21 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_21',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_22 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_22',
  FR_MS_MIAM_DOMESTIC_VIOLENCE_CHECKLIST_VALUE_23 = 'FR_ms_MIAMDomesticViolenceChecklist_Value_23',
}

export const enum MiamUrgencyReason {
  FR_MS_MIAM_URGENCY_REASON_CHECKLIST_VALUE_1 = 'FR_ms_MIAMUrgencyReasonChecklist_Value_1',
  FR_MS_MIAM_URGENCY_REASON_CHECKLIST_VALUE_2 = 'FR_ms_MIAMUrgencyReasonChecklist_Value_2',
  FR_MS_MIAM_URGENCY_REASON_CHECKLIST_VALUE_3 = 'FR_ms_MIAMUrgencyReasonChecklist_Value_3',
  FR_MS_MIAM_URGENCY_REASON_CHECKLIST_VALUE_4 = 'FR_ms_MIAMUrgencyReasonChecklist_Value_4',
  FR_MS_MIAM_URGENCY_REASON_CHECKLIST_VALUE_5 = 'FR_ms_MIAMUrgencyReasonChecklist_Value_5',
  FR_MS_MIAM_URGENCY_REASON_CHECKLIST_VALUE_6 = 'FR_ms_MIAMUrgencyReasonChecklist_Value_6',
}

export const enum MiamPreviousAttendance {
  FR_MS_MIAM_PREVIOUS_ATTENDANCE_CHECKLIST_VALUE_1 = 'FR_ms_MIAMPreviousAttendanceChecklist_Value_1',
  FR_MS_MIAM_PREVIOUS_ATTENDANCE_CHECKLIST_VALUE_2 = 'FR_ms_MIAMPreviousAttendanceChecklist_Value_2',
  FR_MS_MIAM_PREVIOUS_ATTENDANCE_CHECKLIST_VALUE_3 = 'FR_ms_MIAMPreviousAttendanceChecklist_Value_3',
  FR_MS_MIAM_PREVIOUS_ATTENDANCE_CHECKLIST_VALUE_4 = 'FR_ms_MIAMPreviousAttendanceChecklist_Value_4',
  FR_MS_MIAM_PREVIOUS_ATTENDANCE_CHECKLIST_VALUE_5 = 'FR_ms_MIAMPreviousAttendanceChecklist_Value_5',
  FR_MS_MIAM_PREVIOUS_ATTENDANCE_CHECKLIST_VALUE_6 = 'FR_ms_MIAMPreviousAttendanceChecklist_Value_6',
}

export const enum MiamPreviousAttendanceV2 {
  FR_MS_MIAM_PREVIOUS_ATTENDANCE_CHECKLIST_V2_VALUE_1 = 'FR_ms_MIAMPreviousAttendanceChecklistV2_Value_1',
  FR_MS_MIAM_PREVIOUS_ATTENDANCE_CHECKLIST_V2_VALUE_4 = 'FR_ms_MIAMPreviousAttendanceChecklistV2_Value_4',
  FR_MS_MIAM_PREVIOUS_ATTENDANCE_CHECKLIST_V2_VALUE_6 = 'FR_ms_MIAMPreviousAttendanceChecklistV2_Value_6',
}

export const enum MiamOtherGrounds {
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_1 = 'FR_ms_MIAMOtherGroundsChecklist_Value_1',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_2 = 'FR_ms_MIAMOtherGroundsChecklist_Value_2',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_3 = 'FR_ms_MIAMOtherGroundsChecklist_Value_3',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_4 = 'FR_ms_MIAMOtherGroundsChecklist_Value_4',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_5 = 'FR_ms_MIAMOtherGroundsChecklist_Value_5',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_6 = 'FR_ms_MIAMOtherGroundsChecklist_Value_6',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_7 = 'FR_ms_MIAMOtherGroundsChecklist_Value_7',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_8 = 'FR_ms_MIAMOtherGroundsChecklist_Value_8',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_9 = 'FR_ms_MIAMOtherGroundsChecklist_Value_9',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_10 = 'FR_ms_MIAMOtherGroundsChecklist_Value_10',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_11 = 'FR_ms_MIAMOtherGroundsChecklist_Value_11',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_12 = 'FR_ms_MIAMOtherGroundsChecklist_Value_12',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_13 = 'FR_ms_MIAMOtherGroundsChecklist_Value_13',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_14 = 'FR_ms_MIAMOtherGroundsChecklist_Value_14',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_15 = 'FR_ms_MIAMOtherGroundsChecklist_Value_15',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_VALUE_16 = 'FR_ms_MIAMOtherGroundsChecklist_Value_16',
}

export const enum MiamOtherGroundsV2 {
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_V2_VALUE_5 = 'FR_ms_MIAMOtherGroundsChecklistV2_Value_5',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_V2_VALUE_9 = 'FR_ms_MIAMOtherGroundsChecklistV2_Value_9',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_V2_VALUE_12 = 'FR_ms_MIAMOtherGroundsChecklistV2_Value_12',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_V2_VALUE_13 = 'FR_ms_MIAMOtherGroundsChecklistV2_Value_13',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_V2_VALUE_14 = 'FR_ms_MIAMOtherGroundsChecklistV2_Value_14',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_V2_VALUE_15 = 'FR_ms_MIAMOtherGroundsChecklistV2_Value_15',
  FR_MS_MIAM_OTHER_GROUNDS_CHECKLIST_V2_VALUE_16 = 'FR_ms_MIAMOtherGroundsChecklistV2_Value_16',
}

export const enum NatureApplication {
  PERIODICAL_PAYMENT_ORDER = 'periodicalPaymentOrder',
  MAINTENANCE_PENDING_SUIT = 'Maintenance Pending Suit',
  LUMP_SUM_ORDER = 'Lump Sum Order',
  PENSION_SHARING_ORDER = 'Pension Sharing Order',
  PENSION_ATTACHMENT_ORDER = 'Pension Attachment Order',
  PENSION_COMPENSATION_SHARING_ORDER = 'Pension Compensation Sharing Order',
  PENSION_COMPENSATION_ATTACHMENT_ORDER = 'Pension Compensation Attachment Order',
  A_SETTLEMENT_OR_A_TRANSFER_OF_PROPERTY = 'A settlement or a transfer of property',
  PROPERTY_ADJUSTMENT_ORDER = 'propertyAdjustmentOrder',
  VARIATION_ORDER = 'Variation Order',
  CONTESTED_VARIATION_ORDER = 'variationOrder',
  CONSENTED_PERIODICAL_PAYMENT_ORDER = 'Periodical Payment Order',
  CONSENTED_PROPERTY_ADJUSTMENT_ORDER = 'Property Adjustment Order',
}

export const enum NatureApplication5b {
  FR_NATURE_OF_APPLICATION_1 = 'FR_nature_of_application_1',
  FR_NATURE_OF_APPLICATION_2 = 'FR_nature_of_application_2',
  FR_NATURE_OF_APPLICATION_3 = 'FR_nature_of_application_3',
}

export const enum ChildrenOrder {
  STEP_CHILD_OR_STEP_CHILDREN = 'Step Child or Step Children',
  IN_ADDITION_TO_CHILD_SUPPORT = 'In addition to child support',
  DISABILITY_EXPENSES = 'disability expenses',
  TRAINING = 'training',
  WHEN_NOT_HABITUALLY_RESIDENT = 'When not habitually resident',
  OTHER = 'Other',
}

export const enum ConsentNatureOfApplication {
  STEP_CHILD_OR_STEP_CHILDREN = 'Step Child or Step Children',
  IN_ADDITION_TO_CHILD_SUPPORT = 'In addition to child support',
  DISABILITY_EXPENSES = 'disability expenses',
  TRAINING = 'training',
  WHEN_NOT_HABITUALLY_RESIDENT = 'When not habitually resident',
  OTHER = 'Other',
}

export const enum Schedule1OrMatrimonialAndCpList {
  MATRIMONIAL_AND_CIVIL_PARTNERSHIP_PROCEEDINGS = 'In connection to matrimonial and civil partnership proceedings',
  SCHEDULE_1_CHILDREN_ACT_1989 = 'Under paragraph 1 or 2 of schedule 1 children act 1989',
}

export const enum NatureOfApplicationSchedule {
  INTERIM_CHILD_PERIODICAL_PAYMENTS = 'Interim child periodical payments',
  LUMP_SUM_ORDER = 'Lump Sum Order',
  A_SETTLEMENT_OR_A_TRANSFER_OF_PROPERTY = 'A settlement or a transfer of property',
  PERIODICAL_PAYMENT_ORDER = 'periodicalPaymentOrder',
  VARIATION_ORDER = 'variationOrder',
}

export const enum PensionDocumentType {
  FORM_P1 = 'Form P1',
  FORM_P2 = 'Form P2',
  FORM_PPF = 'Form PPF',
  FORM_PPF1 = 'Form PPF1',
  FORM_PPF2 = 'Form PPF2',
}

export const enum PaymentDocumentType {
  COPY_OF_PAPER_FORM_A = 'Copy of paper form A',
}

export const enum UploadConsentOrderDocumentType {
  CONSENT_ORDER = 'consentOrder',
  COVER_ORDER = 'coverOrder',
  P1 = 'P1',
  P2 = 'P2',
  PPF = 'PPF',
  PPF1 = 'PPF1',
  PPF2 = 'PPF2',
  OTHER = 'Other',
}

export const enum UploadOrderDocumentType {
  GENERAL_ORDER = 'generalOrder',
  OTHER = 'Other',
}

export const enum UploadDocumentType {
  FINAL_ORDER = 'Final order',
  CONDITIONAL_ORDER = 'Conditional order',
  NOTICE_OF_ACTING = 'Notice of Acting',
  LETTER_EMAIL_FROM_APPLICANT = 'Letter/Email from Applicant',
  LETTER_EMAIL_FROM_APPLICANT_SOLICITOR = 'Letter/Email from Applicant Solicitor',
  LETTER_EMAIL_FROM_RESPONDENT = 'Letter/Email from Respondent',
  LETTER_EMAIL_FROM_RESPONDENT_SOLICITOR = 'Letter/Email from Respondent Solicitor',
  APPLICATION = 'Application',
  DRAFT_ORDER = 'Draft Order',
  STATEMENT_REPORT = 'Statement / Report',
  OTHER = 'Other',
}

export const enum SolUploadDocumentType {
  OTHER = 'Other',
  NOTICE_OF_ACTING = 'Notice of Acting',
  LETTER_EMAIL = 'Letter / Email',
  SCHEDULE_OF_ASSETS = 'Schedule Of Assets',
  UPDATED_D81 = 'Updated D81',
  AMEND_CONSENT_ORDER = 'Amended Consent Order',
}

export const enum RespondToOrderDocumentType {
  APPLICANT_LETTER_EMAIL = 'ApplicantLetterEmail',
  RESPONDENT_LETTER_EMAIL = 'RespondentLetterEmail',
  AMEND_CONSENT_ORDER = 'AmendedConsentOrder',
  STATEMENT_REPORT = 'StatementReport',
  OTHER = 'Other',
}

export const enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  NOT_GIVEN = 'notGiven',
}

export const enum NottinghamCourt {
  NOTTINGHAM_COUNTY_COURT_AND_FAMILY_COURT = 'FR_s_NottinghamList_1',
  DERBY_COMBINED_COURT_CENTRE = 'FR_s_NottinghamList_2',
  LEICESTER_COUNTY_COURT_AND_FAMILY_COURT = 'FR_s_NottinghamList_3',
  LINCOLN_COUNTY_COURT_AND_FAMILY_COURT = 'FR_s_NottinghamList_4',
  NORTHAMPTON_CROWN_COUNTY_AND_FAMILY_COURT = 'FR_s_NottinghamList_5',
  CHESTERFIELD_COUNTY_COURT = 'FR_s_NottinghamList_6',
  MANSFIELD_MAGISTRATES_AND_COUNTY_COURT = 'FR_s_NottinghamList_7',
  BOSTON_COUNTY_COURT_AND_FAMILY_COURT = 'FR_s_NottinghamList_8',
  LEICESTER_MAGISTRATES_COURT = 'FR_s_NottinghamList_9',
  DERBY_MAGISTRATES_COURT = 'FR_s_NottinghamList_10',
  NOTTINGHAM_JUSTICE_CENTRE = 'FR_s_NottinghamList_11',
  CONSENTED_NOTTINGHAM_COUNTY_COURT_AND_FAMILY_COURT = 'FR_nottinghamList_1',
  CONSENTED_DERBY_COMBINED_COURT_CENTRE = 'FR_nottinghamList_2',
  CONSENTED_LEICESTER_COUNTY_COURT_AND_FAMILY_COURT = 'FR_nottinghamList_3',
  CONSENTED_LINCOLN_COUNTY_COURT_AND_FAMILY_COURT = 'FR_nottinghamList_4',
  CONSENTED_NORTHAMPTON_CROWN_COUNTY_AND_FAMILY_COURT = 'FR_nottinghamList_5',
  CONSENTED_CHESTERFIELD_COUNTY_COURT = 'FR_nottinghamList_6',
  CONSENTED_MANSFIELD_MAGISTRATES_AND_COUNTY_COURT = 'FR_nottinghamList_7',
  CONSENTED_BOSTON_COUNTY_COURT_AND_FAMILY_COURT = 'FR_nottinghamList_8',
  CONSENTED_LEICESTER_MAGISTRATES_COURT = 'FR_nottinghamList_9',
  CONSENTED_DERBY_MAGISTRATES_COURT = 'FR_nottinghamList_10',
  CONSENTED_NOTTINGHAM_JUSTICE_CENTRE = 'FR_nottinghamList_11',
}

export const enum CfcCourt {
  BROMLEY_COUNTY_COURT_AND_FAMILY_COURT = 'FR_s_CFCList_1',
  CROYDON_COUNTY_COURT_AND_FAMILY_COURT = 'FR_s_CFCList_2',
  EDMONTON_COUNTY_COURT_AND_FAMILY_COURT = 'FR_s_CFCList_3',
  KINGSTON_UPON_THAMES_COUNTY_COURT_AND_FAMILY_COURT = 'FR_s_CFCList_4',
  ROMFORDCOUNTY_AND_FAMILY_COURT = 'FR_s_CFCList_5',
  BARNET_CIVIL_AND_FAMILY_COURTS_CENTRE = 'FR_s_CFCList_6',
  BRENTFORD_COUNTY_AND_FAMILY_COURT = 'FR_s_CFCList_8',
  CENTRAL_FAMILY_COURT = 'FR_s_CFCList_9',
  EAST_LONDON_FAMILY_COURT = 'FR_s_CFCList_11',
  UXBRIDGE_COUNTY_COURT_AND_FAMILY_COURT = 'FR_s_CFCList_14',
  WILLESDEN_COUNTY_COURT_AND_FAMILY_COURT = 'FR_s_CFCList_16',
  THE_ROYAL_COURT_OF_JUSTICE = 'FR_s_CFCList_17',
  MIGRATION_TEMP_HC = 'FR_s_londonList_12',
}

export const enum Region {
  MIDLANDS = 'midlands',
  LONDON = 'london',
  NORTHWEST = 'northwest',
  NORTHEAST = 'northeast',
  SOUTHEAST = 'southeast',
  SOUTHWEST = 'southwest',
  WALES = 'wales',
  HIGHCOURT = 'highcourt',
}

export const enum RegionMidlandsFrc {
  NOTTINGHAM = 'nottingham',
  BIRMINGHAM = 'birmingham',
}

export const enum RegionLondonFrc {
  LONDON = 'cfc',
  LONDON_CONSENTED_COURT = 'london',
}

export const enum RegionNorthWestFrc {
  LIVERPOOL = 'liverpool',
  MANCHESTER = 'manchester',
  LANCASHIRE = 'lancashire',
}

export const enum RegionNorthEastFrc {
  CLEVELAND = 'cleveland',
  CLEAVELAND = 'cleaveland',
  NW_YORKSHIRE = 'nwyorkshire',
  HS_YORKSHIRE = 'hsyorkshire',
}

export const enum RegionSouthEastFrc {
  KENT_FRC = 'kentfrc',
  KENT = 'kent',
  BEDFORDSHIRE = 'bedfordshire',
  THAMES_VALLEY = 'thamesvalley',
}

export const enum RegionSouthWestFrc {
  DEVON = 'devon',
  DORSET = 'dorset',
  BRISTOL = 'bristol',
}

export const enum RegionWalesFrc {
  NEWPORT = 'newport',
  SWANSEA = 'swansea',
  NORTH_WALES = 'northwales',
}

export const enum RegionHighCourtFrc {
  HIGHCOURT = 'highcourt',
}

export const enum UploadGeneralDocumentType {
  FINAL_ORDER = 'Final order',
  CONDITIONAL_ORDER = 'Conditional order',
  NOTICE_OF_ACTING = 'Notice of Acting',
  LETTER_EMAIL_FROM_APPLICANT = 'Letter/Email from Applicant',
  LETTER_EMAIL_FROM_APPLICANT_SOLICITOR = 'Letter/Email from Applicant Solicitor',
  LETTER_EMAIL_FROM_RESPONDENT = 'Letter/Email from Respondent',
  LETTER_EMAIL_FROM_RESPONDENT_CONTESTED = 'Letter/Email from Respondent ',
  LETTER_EMAIL_FROM_RESPONDENT_SOLICITOR = 'Letter/Email from Respondent Solicitor',
  APPLICATION = 'Application',
  DRAFT_ORDER = 'Draft Order',
  STATEMENT_REPORT = 'Statement / Report',
  OTHER = 'Other',
}

export const enum RefusalReason {
  FR_MS_REFUSAL_REASON_1 = 'FR_ms_refusalReason_1',
  FR_MS_REFUSAL_REASON_2 = 'FR_ms_refusalReason_2',
  FR_MS_REFUSAL_REASON_3 = 'FR_ms_refusalReason_3',
  FR_MS_REFUSAL_REASON_4 = 'FR_ms_refusalReason_4',
  FR_MS_REFUSAL_REASON_5 = 'FR_ms_refusalReason_5',
  FR_MS_REFUSAL_REASON_6 = 'FR_ms_refusalReason_6',
  FR_MS_REFUSAL_REASON_7 = 'FR_ms_refusalReason_7',
  FR_MS_REFUSAL_REASON_8 = 'FR_ms_refusalReason_8',
  FR_MS_REFUSAL_REASON_9 = 'FR_ms_refusalReason_9',
  FR_MS_REFUSAL_REASON_10 = 'FR_ms_refusalReason_10',
  FR_MS_REFUSAL_REASON_11 = 'FR_ms_refusalReason_11',
  FR_MS_REFUSAL_REASON_12 = 'FR_ms_refusalReason_12',
  FR_MS_REFUSAL_REASON_13 = 'FR_ms_refusalReason_13',
  FR_MS_REFUSAL_REASON_14 = 'FR_ms_refusalReason_14',
}

export const enum AdditionalDocumentType {
  STATEMENT_IN_SUPPORT_INCLUDING_MPS = 'statementInsupportIncludingMPS',
  SCHEDULE_OF_ASSETS = 'scheduleOfAssets',
  LETTER = 'letter',
  NOTICE_OF_ACTING = 'noticeOfActing',
  ALLOCATION_QUESTIONNAIRE = 'allocationQuestionnaire',
  OTHER = 'other',
}

export const enum CaseDocumentType {
  STATEMENT_OF_ISSUES = 'Statement of Issues',
  CHRONOLOGY = 'Chronology',
  FORM_B = 'Form B',
  APPLICANT_FORM_E = 'Applicant - Form E',
  FORM_F = 'Form F',
  FORM_H = 'Form H',
  LETTER_FROM_APPLICANT = 'Letter from Applicant',
  CASE_SUMMARY = 'Case Summary',
  QUESTIONNAIRE = 'Questionnaire',
  REPLY_TO_QUESTIONNAIRE = 'Reply to Questionnaire',
  VALUATION_REPORT = 'Valuation Report',
  PENSION_PLAN = 'Pension Plan',
  POSITION_STATEMENT_SKELETON_ARGUMENT = 'Position Statement',
  SKELETON_ARGUMENT = 'Skeleton Argument',
  EXPERT_EVIDENCE = 'Expert Evidence',
  STATEMENT_AFFIDAVIT = 'Statement/Affidavit',
  WITNESS_STATEMENT_AFFIDAVIT = 'Witness Statement/Affidavit',
  CARE_PLAN = 'Care Plan',
  OFFERS = 'Offers',
  TRIAL_BUNDLE = 'Trial Bundle',
  CONDITIONAL_ORDER = 'Conditional order',
  FINAL_ORDER = 'Final order',
  OTHER = 'other',
  ATTENDANCE_SHEETS = 'Attendance Sheets',
  BILL_OF_COSTS = 'Bill of Costs',
  CERTIFICATES_OF_SERVICE = 'Certificates of service',
  ES1 = 'ES1',
  ES2 = 'ES2',
  HOUSING_PARTICULARS = 'Housing particulars',
  JUDICIAL_NOTES = 'Judicial notes',
  JUDGMENT = 'Judgment',
  MORTGAGE_CAPACITIES = 'Mortgage capacities',
  PENSION_REPORT = 'Pension report',
  PRE_HEARING_DRAFT_ORDER = 'Pre hearing draft order',
  TRANSCRIPT = 'Transcript',
  WITHOUT_PREJUDICE_OFFERS = 'Without Prejudice offers',
  WITNESS_SUMMONS = 'Witness Summons',
  POINTS_OF_CLAIM_OR_DEFENCE = 'Points of claim/defence',
  FM5 = 'FM5',
  HEARING_NOTICE = 'Hearing notice',
  VACATE_HEARING_NOTICE = 'Vacate hearing notice',
  FORM_C = 'Form C',
  FORM_C_FAST_TRACK = 'Form C - Fast Track',
  FORM_C_EXPRESS = 'Form C - Express',
  FORM_G = 'Form G',
  OUT_OF_COURT_RESOLUTION = 'Out of court resolution',
  PFD_NCDR_COMPLIANCE_LETTER = 'PFD NCDR compliance letter',
  PFD_NCDR_COVER_LETTER = 'PFD NCDR cover letter',
}

export const enum HearingMode {
  IN_PERSON = 'In_Person',
  VIDEO_CALL = 'Video_Call',
  PHONE_CALL = 'Phone_Call',
  HYBRID = 'Hybrid',
}

export const enum VacateOrAdjournAction {
  ADJOURN_HEARING = 'Adjourn_Hearing',
  VACATE_HEARING = 'Vacate_Hearing',
}

export const enum VacateOrAdjournReason {
  CASE_NOT_READY = 'Case_Not_Ready',
  CASE_SETTLED = 'Case_Settled',
  CASE_REP_UNAVAILABLE = 'Legal_Rep_Unavailable',
  COURTROOM_UNAVAILABLE = 'Courtroom_Unavailable',
  SPECIAL_MEASURES_NOT_AVAILABLE = 'Special_Measures_Not_Available',
  INTERPRETER_UNAVAILABLE = 'Interpreter_Unavailable',
  JUDGE_UNAVAILABLE = 'Judge_Unavailable',
  INSUFFICIENT_TIME = 'Insufficient_Time',
  CASE_STAYED = 'Case_Stayed',
  ADJOURNED = 'Adjourned',
  CASE_TRANSFERRED = 'Case_Transferred',
  OTHER = 'Other',
}

export const enum JudgeApprovalDocType {
  DRAFT_ORDER = 'DRAFT_ORDER',
  PSA = 'PSA',
}

export const enum JudgeDecision {
  REVIEW_LATER = 'REVIEW_LATER',
  LEGAL_REP_NEEDS_TO_MAKE_CHANGE = 'LEGAL_REP_NEEDS_TO_MAKE_CHANGE',
  JUDGE_NEEDS_TO_MAKE_CHANGES = 'JUDGE_NEEDS_TO_MAKE_CHANGES',
  READY_TO_BE_SEALED = 'READY_TO_BE_SEALED',
}

export const enum OtherDocumentType {
  SCHEDULE_OF_ASSETS = 'ScheduleOfAssets',
  LETTER = 'Letter',
  NOTICE_OF_ACTING = 'Notice of acting',
  OTHER = 'Other',
}

export const enum IntervenerType {
  INTERVENER_ONE = 'INTERVENER_ONE',
  INTERVENER_TWO = 'INTERVENER_TWO',
  INTERVENER_THREE = 'INTERVENER_THREE',
  INTERVENER_FOUR = 'INTERVENER_FOUR',
}

export const enum IntervenerHearingNoticeCollectionName {
  INTV_1 = 'INTV_1',
  INTV_2 = 'INTV_2',
  INTV_3 = 'INTV_3',
  INTV_4 = 'INTV_4',
}

export const enum PaperNotificationRecipient {
  APPLICANT = 'APPLICANT',
  RESPONDENT = 'RESPONDENT',
  SOLICITOR = 'SOLICITOR',
  APP_SOLICITOR = 'APP_SOLICITOR',
  RESP_SOLICITOR = 'RESP_SOLICITOR',
  INTERVENER_ONE = 'INTERVENER_ONE',
  INTERVENER_TWO = 'INTERVENER_TWO',
  INTERVENER_THREE = 'INTERVENER_THREE',
  INTERVENER_FOUR = 'INTERVENER_FOUR',
}

export const enum BirminghamCourt {
  BIRMINGHAM_CIVIL_AND_FAMILY_JUSTICE_CENTRE = 'FR_birmingham_hc_list_1',
  COVENTRY_COMBINED_COURT_CENTRE = 'FR_birmingham_hc_list_2',
  TELFORD_COUNTY_COURT_AND_FAMILY_COURT = 'FR_birmingham_hc_list_3',
  WOLVERHAMPTON_COMBINED_COURT_CENTRE = 'FR_birmingham_hc_list_4',
  DUDLEY_COUNTY_COURT_AND_FAMILY_COURT = 'FR_birmingham_hc_list_5',
  WALSALL_COUNTY_AND_FAMILY_COURT = 'FR_birmingham_hc_list_6',
  STOKE_ON_TRENT_COMBINED_COURT = 'FR_birmingham_hc_list_7',
  WORCESTER_COMBINED_COURT = 'FR_birmingham_hc_list_8',
  STAFFORD_COMBINED_COURT = 'FR_birmingham_hc_list_9',
  HEREFORD_COUNTY_COURT_AND_FAMILY_COURT = 'FR_birmingham_hc_list_10',
  WARWICKSHIRE_JUSTICE_CENTRE = 'FR_birmingham_hc_list_11',
  CONSENTED_BIRMINGHAM_CIVIL_AND_FAMILY_JUSTICE_CENTRE = 'FR_birminghamList_1',
  CONSENTED_COVENTRY_COMBINED_COURT_CENTRE = 'FR_birminghamList_2',
  CONSENTED_TELFORD_COUNTY_COURT_AND_FAMILY_COURT = 'FR_birminghamList_3',
  CONSENTED_WOLVERHAMPTON_COMBINED_COURT_CENTRE = 'FR_birminghamList_4',
  CONSENTED_DUDLEY_COUNTY_COURT_AND_FAMILY_COURT = 'FR_birminghamList_5',
  CONSENTED_WALSALL_COUNTY_AND_FAMILY_COURT = 'FR_birminghamList_6',
  CONSENTED_STOKE_ON_TRENT_COMBINED_COURT = 'FR_birminghamList_7',
  CONSENTED_WORCESTER_COMBINED_COURT = 'FR_birminghamList_8',
  CONSENTED_STAFFORD_COMBINED_COURT = 'FR_birminghamList_9',
  CONSENTED_HEREFORD_COUNTY_COURT_AND_FAMILY_COURT = 'FR_birminghamList_10',
  CONSENTED_WARWICKSHIRE_JUSTICE_CENTRE = 'FR_birminghamList_11',
}

export const enum LiverpoolCourt {
  LIVERPOOL_CIVIL_FAMILY_COURT = 'FR_liverpool_hc_list_1',
  CHESTER_CIVIL_FAMILY_JUSTICE = 'FR_liverpool_hc_list_2',
  CREWE_COUNTY_FAMILY_COURT = 'FR_liverpool_hc_list_3',
  ST_HELENS_COUNTY_FAMILY_COURT = 'FR_liverpool_hc_list_4',
  BIRKENHEAD_COUNTY_FAMILY_COURT = 'FR_liverpool_hc_list_5',
  CONSENTED_LIVERPOOL_CIVIL_FAMILY_COURT = 'FR_liverpoolList_1',
  CONSENTED_CHESTER_CIVIL_FAMILY_JUSTICE = 'FR_liverpoolList_2',
  CONSENTED_CREWE_COUNTY_FAMILY_COURT = 'FR_liverpoolList_3',
  CONSENTED_ST_HELENS_COUNTY_FAMILY_COURT = 'FR_liverpoolList_4',
  CONSENTED_BIRKENHEAD_COUNTY_FAMILY_COURT = 'FR_liverpoolList_5',
}

export const enum ManchesterCourt {
  MANCHESTER_COURT = 'FR_manchester_hc_list_1',
  STOCKPORT_COURT = 'FR_manchester_hc_list_2',
  WIGAN_COURT = 'FR_manchester_hc_list_3',
  CONSENTED_MANCHESTER_COURT = 'FR_manchesterList_1',
  CONSENTED_STOCKPORT_COURT = 'FR_manchesterList_2',
  CONSENTED_WIGAN_COURT = 'FR_manchesterList_3',
}

export const enum LancashireCourt {
  PRESTON_COURT = 'FR_lancashireList_1',
  BLACKBURN_COURT = 'FR_lancashireList_2',
  BLACKPOOL_COURT = 'FR_lancashireList_3',
  LANCASTER_COURT = 'FR_lancashireList_4',
  LEYLAND_COURT = 'FR_lancashireList_5',
  REEDLEY_COURT = 'FR_lancashireList_6',
  BARROW_COURT = 'FR_lancashireList_7',
  CARLISLE_COURT = 'FR_lancashireList_8',
  WEST_CUMBRIA_COURT = 'FR_lancashireList_9',
}

export const enum ClevelandCourt {
  FR_CLEVELAND_HC_LIST_1 = 'FR_cleaveland_hc_list_1',
  FR_CLEVELAND_HC_LIST_2 = 'FR_cleaveland_hc_list_2',
  FR_CLEVELAND_HC_LIST_3 = 'FR_cleaveland_hc_list_3',
  FR_CLEVELAND_HC_LIST_4 = 'FR_cleaveland_hc_list_4',
  FR_CLEVELAND_HC_LIST_5 = 'FR_cleaveland_hc_list_5',
  FR_CLEVELAND_HC_LIST_6 = 'FR_cleaveland_hc_list_6',
  FR_CLEVELAND_HC_LIST_7 = 'FR_cleaveland_hc_list_7',
  FR_CLEVELAND_HC_LIST_8 = 'FR_cleaveland_hc_list_8',
  FR_CLEVELAND_HC_LIST_9 = 'FR_cleaveland_hc_list_9',
  FR_CLEVELAND_HC_LIST_10 = 'FR_cleaveland_hc_list_10',
  FR_CLEVELAND_HC_LIST_11 = 'FR_cleaveland_hc_list_11',
  FR_CLEVELAND_LIST_1 = 'FR_clevelandList_1',
  FR_CLEVELAND_LIST_2 = 'FR_clevelandList_2',
  FR_CLEVELAND_LIST_3 = 'FR_clevelandList_3',
  FR_CLEVELAND_LIST_4 = 'FR_clevelandList_4',
  FR_CLEVELAND_LIST_5 = 'FR_clevelandList_5',
  FR_CLEVELAND_LIST_6 = 'FR_clevelandList_6',
  FR_CLEVELAND_LIST_7 = 'FR_clevelandList_7',
  FR_CLEVELAND_LIST_8 = 'FR_clevelandList_8',
  FR_CLEVELAND_LIST_9 = 'FR_clevelandList_9',
  FR_CLEVELAND_LIST_10 = 'FR_clevelandList_10',
  FR_CLEVELAND_LIST_11 = 'FR_clevelandList_11',
}

export const enum NwYorkshireCourt {
  HARROGATE_COURT = 'FR_nw_yorkshire_hc_list_1',
  BRADFORD_COURT = 'FR_nw_yorkshire_hc_list_2',
  HUDDERSFIELD_COURT = 'FR_nw_yorkshire_hc_list_3',
  WAKEFIELD_COURT = 'FR_nw_yorkshire_hc_list_4',
  YORK_COURT = 'FR_nw_yorkshire_hc_list_5',
  SCARBOROUGH_COURT = 'FR_nw_yorkshire_hc_list_6',
  LEEDS_COURT = 'FR_nw_yorkshire_hc_list_7',
  PRESTON_COURT = 'FR_nw_yorkshire_hc_list_8',
  CONSENTED_HARROGATE_COURT = 'FR_nw_yorkshireList_1',
  CONSENTED_BRADFORD_COURT = 'FR_nw_yorkshireList_2',
  CONSENTED_HUDDERSFIELD_COURT = 'FR_nw_yorkshireList_3',
  CONSENTED_WAKEFIELD_COURT = 'FR_nw_yorkshireList_4',
  CONSENTED_YORK_COURT = 'FR_nw_yorkshireList_5',
  CONSENTED_SCARBOROUGH_COURT = 'FR_nw_yorkshireList_6',
  CONSENTED_LEEDS_COURT = 'FR_nw_yorkshireList_7',
  CONSENTED_PRESTON_COURT = 'FR_nw_yorkshireList_8',
}

export const enum HumberCourt {
  FR_humberList_1 = 'FR_humber_hc_list_1',
  FR_humberList_2 = 'FR_humber_hc_list_2',
  FR_humberList_3 = 'FR_humber_hc_list_3',
  FR_humberList_4 = 'FR_humber_hc_list_4',
  FR_humberList_5 = 'FR_humber_hc_list_5',
  FR_humberList_6 = 'FR_humber_hc_list_6',
  FR_humberList_7 = 'FR_humber_hc_list_7',
  CONSENTED_FR_humberList_1 = 'FR_humberList_1',
  CONSENTED_FR_humberList_2 = 'FR_humberList_2',
  CONSENTED_FR_humberList_3 = 'FR_humberList_3',
  CONSENTED_FR_humberList_4 = 'FR_humberList_4',
  CONSENTED_FR_humberList_5 = 'FR_humberList_5',
  CONSENTED_FR_humberList_6 = 'FR_humberList_6',
  CONSENTED_FR_humberList_7 = 'FR_humberList_7',
}

export const enum KentSurreyCourt {
  FR_kent_surreyList_1 = 'FR_kent_surrey_hc_list_1',
  FR_kent_surreyList_2 = 'FR_kent_surrey_hc_list_2',
  FR_kent_surreyList_3 = 'FR_kent_surrey_hc_list_3',
  FR_kent_surreyList_4 = 'FR_kent_surrey_hc_list_4',
  FR_kent_surreyList_5 = 'FR_kent_surrey_hc_list_5',
  FR_kent_surreyList_6 = 'FR_kent_surrey_hc_list_6',
  FR_kent_surreyList_7 = 'FR_kent_surrey_hc_list_7',
  FR_kent_surreyList_8 = 'FR_kent_surrey_hc_list_8',
  FR_kent_surreyList_9 = 'FR_kent_surrey_hc_list_9',
  FR_kent_surreyList_10 = 'FR_kent_surrey_hc_list_10',
  FR_kent_surreyList_11 = 'FR_kent_surrey_hc_list_11',
  FR_kent_surreyList_12 = 'FR_kent_surrey_hc_list_12',
  FR_kent_surreyList_13 = 'FR_kent_surrey_hc_list_13',
  FR_kent_surreyList_14 = 'FR_kent_surrey_hc_list_14',
  FR_kent_surreyList_15 = 'FR_kent_surrey_hc_list_15',
  FR_kent_surreyList_16 = 'FR_kent_surrey_hc_list_16',
  CONSENTED_FR_kent_surreyList_1 = 'FR_kent_surreyList_1',
  CONSENTED_FR_kent_surreyList_2 = 'FR_kent_surreyList_2',
  CONSENTED_FR_kent_surreyList_3 = 'FR_kent_surreyList_3',
  CONSENTED_FR_kent_surreyList_4 = 'FR_kent_surreyList_4',
  CONSENTED_FR_kent_surreyList_5 = 'FR_kent_surreyList_5',
  CONSENTED_FR_kent_surreyList_6 = 'FR_kent_surreyList_6',
  CONSENTED_FR_kent_surreyList_7 = 'FR_kent_surreyList_7',
  CONSENTED_FR_kent_surreyList_8 = 'FR_kent_surreyList_8',
  CONSENTED_FR_kent_surreyList_9 = 'FR_kent_surreyList_9',
  CONSENTED_FR_kent_surreyList_10 = 'FR_kent_surreyList_10',
  CONSENTED_FR_kent_surreyList_11 = 'FR_kent_surreyList_11',
  CONSENTED_FR_kent_surreyList_12 = 'FR_kent_surreyList_12',
  CONSENTED_FR_kent_surreyList_13 = 'FR_kent_surreyList_13',
  CONSENTED_FR_kent_surreyList_14 = 'FR_kent_surreyList_14',
  CONSENTED_FR_kent_surreyList_15 = 'FR_kent_surreyList_15',
  CONSENTED_FR_kent_surreyList_16 = 'FR_kent_surreyList_16',
}

export const enum BedfordshireCourt {
  PETERBOROUGH = 'FR_bedfordshireList_1',
  CAMBRIDGE = 'FR_bedfordshireList_2',
  BURY = 'FR_bedfordshireList_3',
  NORWICH = 'FR_bedfordshireList_4',
  IPSWICH = 'FR_bedfordshireList_5',
  CHELMSFORD = 'FR_bedfordshireList_6',
  SOUTHEND = 'FR_bedfordshireList_7',
  BEDFORD = 'FR_bedfordshireList_8',
  LUTON = 'FR_bedfordshireList_9',
  HERTFORD = 'FR_bedfordshireList_10',
  WATFORD = 'FR_bedfordshireList_11',
  GREAT_YARMOUTH = 'FR_bedfordshireList_12',
  KINGS_LYNN = 'FR_bedfordshireList_13',
}

export const enum ThamesValleyCourt {
  OXFORD = 'FR_thamesvalleyList_1',
  READING = 'FR_thamesvalleyList_2',
  MILTON_KEYNES = 'FR_thamesvalleyList_3',
  SLOUGH = 'FR_thamesvalleyList_4',
}

export const enum DevonCourt {
  PLYMOUTH = 'FR_devonList_1',
  EXETER = 'FR_devonList_2',
  TAUNTON = 'FR_devonList_3',
  TORQUAY = 'FR_devonList_4',
  BARNSTAPLE = 'FR_devonList_5',
  TRURO = 'FR_devonList_6',
  YEOVIL = 'FR_devonList_7',
  BODMIN = 'FR_devonList_8',
}

export const enum DorsetCourt {
  BOURNEMOUTH = 'FR_dorsetList_1',
  WEYMOUTH = 'FR_dorsetList_2',
  WINCHESTER = 'FR_dorsetList_3',
  PORTSMOUTH = 'FR_dorsetList_4',
  SOUTHAMPTON = 'FR_dorsetList_5',
  ALDERSHOT = 'FR_dorsetList_6',
  BASINGSTOKE = 'FR_dorsetList_7',
  ISLE_OF_WIGHT = 'FR_dorsetList_8',
}

export const enum BristolCourt {
  BRISTOL_CIVIL_AND_FAMILY_JUSTICE_CENTRE = 'FR_bristolList_1',
  GLOUCESTER_AND_CHELTENHAM_COUNTY_AND_FAMILY_COURT = 'FR_bristolList_2',
  SWINDON_COMBINED_COURT = 'FR_bristolList_3',
  SALISBURY_LAW_COURTS = 'FR_bristolList_4',
  BATH_LAW_COURTS = 'FR_bristolList_5',
  WESTON_SUPER_MARE_COUNTY_AND_FAMILY_COURT = 'FR_bristolList_6',
  BRISTOL_MAGISTRATES_COURT = 'FR_bristolList_7',
  SWINDON_MAGISTRATES_COURT = 'FR_bristolList_8',
}

export const enum NewportCourt {
  FR_newportList_1 = 'FR_newport_hc_list_1',
  FR_newportList_2 = 'FR_newport_hc_list_2',
  FR_newportList_3 = 'FR_newport_hc_list_3',
  FR_newportList_4 = 'FR_newport_hc_list_4',
  FR_newportList_5 = 'FR_newport_hc_list_5',
  CONSENTED_FR_newportList_1 = 'FR_newportList_1',
  CONSENTED_FR_newportList_2 = 'FR_newportList_2',
  CONSENTED_FR_newportList_3 = 'FR_newportList_3',
  CONSENTED_FR_newportList_4 = 'FR_newportList_4',
  CONSENTED_FR_newportList_5 = 'FR_newportList_5',
}

export const enum SwanseaCourt {
  FR_swanseaList_1 = 'FR_swansea_hc_list_1',
  FR_swanseaList_2 = 'FR_swansea_hc_list_2',
  FR_swanseaList_3 = 'FR_swansea_hc_list_3',
  FR_swanseaList_4 = 'FR_swansea_hc_list_4',
  FR_swanseaList_5 = 'FR_swansea_hc_list_5',
  FR_swanseaList_6 = 'FR_swansea_hc_list_6',
  CONSENTED_FR_swanseaList_1 = 'FR_swanseaList_1',
  CONSENTED_FR_swanseaList_2 = 'FR_swanseaList_2',
  CONSENTED_FR_swanseaList_3 = 'FR_swanseaList_3',
  CONSENTED_FR_swanseaList_4 = 'FR_swanseaList_4',
  CONSENTED_FR_swanseaList_5 = 'FR_swanseaList_5',
  CONSENTED_FR_swanseaList_6 = 'FR_swanseaList_6',
}

export const enum NorthWalesCourt {
  WREXHAM = 'FR_northwalesList_1',
  CAERNARFON = 'FR_northwalesList_2',
  PRESTATYN = 'FR_northwalesList_3',
  WELSHPOOL = 'FR_northwalesList_4',
  MOLD = 'FR_northwalesList_5',
  LLUNDUDNO = 'FR_northwalesList_6',
}

export const enum HighCourt {
  HIGHCOURT_COURT = 'FR_highCourtList_1',
}

export const enum CaseDocumentParty {
  APPLICANT = 'applicant',
  RESPONDENT = 'respondent',
  INTERVENER_ONE = 'intervener1',
  INTERVENER_TWO = 'intervener2',
  INTERVENER_THREE = 'intervener3',
  INTERVENER_FOUR = 'intervener4',
  CASE = 'case',
}

export const enum HearingType {
  MPS = 'Maintenance Pending Suit (MPS)',
  FDA = 'First Directions Appointment (FDA)',
  ADJOURNED_FDA = 'Adjourned First Directions Appointment (FDA)',
  FDR = 'Financial Dispute Resolution (FDR)',
  ADJOURNED_FDR = 'Adjourned Financial Dispute Resolution (FDR)',
  FH = 'Final Hearing (FH)',
  DIR = 'Directions (DIR)',
  MENTION = 'Mention',
  PERMISSION_TO_APPEAL = 'Permission to Appeal',
  APPEAL_HEARING = 'Appeal Hearing (Financial Remedy)',
  APPLICATION_HEARING = 'Application Hearing',
  RETRIAL_HEARING = 'Retrial Hearing',
  PTR = 'Pre-Trial Review (PTR)',
}

export const enum OrderFiledBy {
  APPLICANT = 'The applicant',
  RESPONDENT = 'The respondent',
  APPLICANT_BARRISTER = 'The applicant barrister',
  RESPONDENT_BARRISTER = 'The respondent barrister',
  INTERVENER_1 = 'The intervener 1',
  INTERVENER_2 = 'The intervener 2',
  INTERVENER_3 = 'The intervener 3',
  INTERVENER_4 = 'The intervener 4',
}

export const enum OrderStatus {
  TO_BE_REVIEWED = 'TO_BE_REVIEWED',
  APPROVED_BY_JUDGE = 'APPROVED_BY_JUDGE',
  PROCESSED = 'PROCESSED',
  REFUSED = 'REFUSED',
}

export const enum LondonCourt {
  CENTRAL_FAMILY_COURT = 'FR_londonList_1',
  WILLESDEN_COUNTY_COURT_AND_FAMILY_COURT = 'FR_londonList_2',
  UXBRIDGE_COUNTY_COURT_AND_FAMILY_COURT = 'FR_londonList_3',
  EAST_LONDON_FAMILY_COURT = 'FR_londonList_4',
  BRENTFORD_COUNTY_AND_FAMILY_COURT = 'FR_londonList_5',
  BARNET_CIVIL_AND_FAMILY_COURTS_CENTRE = 'FR_londonList_6',
  ROMFORDCOUNTY_AND_FAMILY_COURT = 'FR_londonList_7',
  KINGSTON_UPON_THAMES_COUNTY_COURT_AND_FAMILY_COURT = 'FR_londonList_8',
  EDMONTON_COUNTY_COURT_AND_FAMILY_COURT = 'FR_londonList_9',
  CROYDON_COUNTY_COURT_AND_FAMILY_COURT = 'FR_londonList_10',
  BROMLEY_COUNTY_COURT_AND_FAMILY_COURT = 'FR_londonList_11',
  MIGRATION_TEMP_HC = 'FR_londonList_12',
  THE_ROYAL_COURT_OF_JUSTICE = 'FR_londonList_13',
}

export const enum HearingTimeDirection {
  STANDARD_TIME = 'standardTime',
  ADDITIONAL_TIME_REQ = 'additionalTimeReq',
}

export const enum ConsentOrderType {
  GENERAL_ORDER = 'generalOrder',
  OTHER = 'Other',
}

export const enum VariationTypeOfDocument {
  ORIGINAL_ORDER = 'originalOrder',
  OTHER_DOCUMENTS = 'Other',
}

export const enum ChildRelation {
  MOTHER = 'Mother',
  FATHER = 'Father',
  STEP_MOTHER = 'Step mother',
  STEP_FATHER = 'Step father',
  GRAND_PARENT = 'Grand parent',
  GUARDIAN = 'Guardian',
  SPECIAL_GUARDIAN = 'Special Guardian',
  OTHER = 'Other',
}

export const enum Yes {
  YES = 'YES',
}
