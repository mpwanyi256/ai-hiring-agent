import { google } from 'googleapis';

export interface GoogleCalendarEventInput {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees: Array<{ email: string }>;
}

export interface GoogleCalendarEventResult {
  eventId: string;
  meetLink: string | null;
}

export async function createInterviewEvent({
  accessToken,
  eventInput,
}: {
  accessToken: string;
  eventInput: GoogleCalendarEventInput;
}): Promise<GoogleCalendarEventResult> {
  const calendar = google.calendar('v3');
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const event = await calendar.events.insert({
    auth,
    calendarId: 'primary',
    requestBody: {
      ...eventInput,
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(2),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
    conferenceDataVersion: 1,
  });

  return {
    eventId: event.data.id!,
    meetLink:
      event.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ||
      null,
  };
}

export async function updateInterviewEvent({
  accessToken,
  eventId,
  eventInput,
}: {
  accessToken: string;
  eventId: string;
  eventInput: GoogleCalendarEventInput;
}): Promise<GoogleCalendarEventResult> {
  const calendar = google.calendar('v3');
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const event = await calendar.events.patch({
    auth,
    calendarId: 'primary',
    eventId,
    requestBody: {
      ...eventInput,
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(2),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
    conferenceDataVersion: 1,
  });

  return {
    eventId: event.data.id!,
    meetLink:
      event.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ||
      null,
  };
}
