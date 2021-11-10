type Relations = Map<string, any>;
interface Work {
    publisher: String,
    title: String[],
    original_title?: String[],
    language?: String,
    short_title?: String[],
    abstract_?: String,
    references_count: Number,
    is_referenced_by_count: Number,
    source: String,
    journal_issue?: Issue,
    prefix: String,
    doi: String,
    url: String,
    member: String,
    type_: String,
    created?: Date,
    date?: Date,
    deposited?: Date,
    score?: Number,
    indexed: Date,
    issued: PartialDate,
    posted?: PartialDate,
    accepted?: PartialDate,
    subtitle?: String[],
    container_title?: String[],
    short_container_title?: String[],
    group_title?: String,
    issue?: String,
    volume?: String,
    page?: String,
    article_number?: String,
    published_print?: PartialDate,
    published_online?: PartialDate,
    subject?: String[],
    issn?: String[],
    issn_type?: ISSN[],
    isbn?: String[],
    archive?: String[],
    license?: License[],
    funder?: FundingBody[],
    assertion?: Assertion[],
    author?: Contributor[],
    editor?: Contributor[],
    chair?: Contributor[],
    translator?: Contributor[],
    update_to?: Update[],
    update_policy?: String,
    link?: ResourceLink[],
    clinical_trial_number?: ClinicalTrialNumber[],
    alternative_id?: String[],
    reference?: Reference[],
    content_domain?: ContentDomain,
    relation?: Relations,
    review?: Relations,
}
type DateParts = (Number | undefined)[][];
interface FundingBody {
    name: String,
    doi?: String,
    award?: String[],
    doi_asserted_by?: String,
}
interface ClinicalTrialNumber {
    clinical_trial_number: String,
    registry: String,
    type_?: String,
}
interface Contributor {
    family: String,
    given?: String,
    orcid?: String,
    authenticated_orcid?: Boolean,
    affiliation?: Affiliation[],
}
interface Affiliation {
    name: String,
}
interface Date {
    date_parts: DateParts,
    timestamp: Number,
    date_time: String,
}
interface PartialDate {
    date_parts: DateParts,
}
interface Update {
    updated: PartialDate,
    doi: String,
    type_: String,
    label?: String,
}
interface Assertion {
    name: String,
    value: String,
    url?: String,
    explanation?: String,
    label?: String,
    order?: Number,
    group?: AssertionGroup,
}
interface Issue {
    published_print?: PartialDate,
    published_online?: PartialDate,
    issue?: String,
}
interface AssertionGroup {
    name: String,
    label?: String,
}
interface Agency {
    id: String,
    label?: String,
}
interface License {
    content_version: String,
    delay_in_days: Number,
    start: PartialDate,
    url: String,
}
interface ResourceLink {
    intended_application: String,
    content_version: String,
    url: String,
    content_type?: String,
}
interface Reference {
    key: String,
    doi?: String,
    doi_asserted_by?: String,
    issue?: String,
    first_page?: String,
    volume?: String,
    edition?: String,
    component?: String,
    standard_designator?: String,
    standards_body?: String,
    author?: String,
    year?: String,
    unstructured?: String,
    journal_title?: String,
    article_title?: String,
    series_title?: String,
    volume_title?: String,
    issn?: String,
    issn_type?: String,
    isbn?: String,
    isbn_type?: String,
}
interface ISSN {
    value: String,
    type_: String,
}
interface ContentDomain {
    domain: String[],
    crossmark_restriction: Boolean,
}
interface Relation {
    id_type?: String,
    id?: String,
    asserted_by?: String,
}
interface Review {
    running_number?: String,
    revision_round?: String,
    stage?: String,
    recommendation?: String,
    type_: String,
    competing_interest_statement?: String,
    language?: String,
}



interface WorksMessage {
    status: string
    "message-type": string
    "message-version": string
    message: Works
}