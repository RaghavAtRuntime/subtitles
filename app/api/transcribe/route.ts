export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const incomingForm = await request.formData();
    const file = incomingForm.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No file provided." }, { status: 400 });
    }

    // Forward the file to the Python backend
    const outgoingForm = new FormData();
    outgoingForm.append("file", file, file.name);

    let backendRes: Response;
    try {
      backendRes = await fetch(`${BACKEND_URL}/transcribe`, {
        method: "POST",
        body: outgoingForm,
      });
    } catch {
      return Response.json(
        {
          error:
            "Could not reach the transcription backend. " +
            "Make sure the Python server is running: `uvicorn main:app --port 8000` (inside the backend/ folder).",
        },
        { status: 503 }
      );
    }

    if (!backendRes.ok) {
      let detail = "Transcription failed.";
      try {
        const errBody = await backendRes.json();
        detail = errBody.detail ?? errBody.error ?? detail;
      } catch {
        /* ignore parse error */
      }
      return Response.json({ error: detail }, { status: backendRes.status });
    }

    const data = await backendRes.json();
    return Response.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return Response.json({ error: message }, { status: 500 });
  }
}
