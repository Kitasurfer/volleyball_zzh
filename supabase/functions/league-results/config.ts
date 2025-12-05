const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const SERIES_URL =
  "https://www.vlw-online.de/cms/home/spielbetrieb/mixed/mixed_24.xhtml?LeaguePresenter.view=resultTable&LeaguePresenter.matchSeriesId=95219095";
const TEAM_DETAILS_URL =
  "https://www.vlw-online.de/popup/matchSeries/teamDetails.xhtml?teamId=95219114";

const TEAM_NAME = "SG TSV Zizishausen/SKV Unterensingen";

const standingsRegex = /data_scoreHistory_\d+\.push\((\{[\s\S]*?\})\);/g;
const rowRegex = /<tr[\s\S]*?<\/tr>/g;
const scheduleTableRegex = /<table class="samsDataTable">[\s\S]*?<\/table>/;

export {
  corsHeaders,
  SERIES_URL,
  TEAM_DETAILS_URL,
  TEAM_NAME,
  standingsRegex,
  rowRegex,
  scheduleTableRegex,
};
