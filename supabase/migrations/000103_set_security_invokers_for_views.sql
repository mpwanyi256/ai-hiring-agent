-- Set row level policy
ALTER VIEW public.candidate_details SET (security_invoker = on);
GRANT SELECT ON public.candidate_details TO authenticated;

ALTER VIEW public.candidate_timeline_events SET (security_invoker = on);
GRANT SELECT ON public.candidate_timeline_events TO authenticated;

ALTER VIEW public.jobs_comprehensive SET (security_invoker = on);
GRANT SELECT ON public.jobs_comprehensive TO authenticated;

ALTER VIEW public.messages_detailed SET (security_invoker = on);
GRANT SELECT ON public.messages_detailed TO authenticated;

ALTER VIEW public.team_responses_detailed SET (security_invoker = on);
GRANT SELECT ON public.team_responses_detailed TO authenticated; 