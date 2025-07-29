import { NextResponse } from 'next/server';
import { db, userDashboards, eq } from '@pagespace/db';
import { decodeToken } from '@pagespace/lib/server';
import { z } from 'zod';
import { parse } from 'cookie';

const patchSchema = z.object({
  content: z.string(),
});

const defaultDashboardContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PageSpace</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0A111E;
            color: #e2e8f0;
            min-height: 100vh;
            padding: 1.5rem;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: #1e293b;
            border-radius: 12px;
            border: 1px solid #334155;
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #1e40af, #3730a3);
            padding: 2rem;
            text-align: center;
            border-bottom: 1px solid #334155;
        }

        .header h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: white;
        }

        .header p {
            color: #cbd5e1;
            font-size: 1rem;
        }

        .content {
            padding: 1.5rem;
        }

        .quick-start {
            background: #334155;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border: 1px solid #475569;
        }

        .quick-start h2 {
            color: #f1f5f9;
            font-size: 1.1rem;
            margin-bottom: 1rem;
            font-weight: 600;
        }

        .steps {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1rem;
        }

        .step {
            background: #475569;
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid #64748b;
            transition: all 0.2s ease;
        }

        .step:hover {
            background: #64748b;
            border-color: #94a3b8;
        }

        .step-number {
            background: #3b82f6;
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 600;
            margin-right: 0.75rem;
        }

        .step h3 {
            color: #f1f5f9;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
        }

        .step p {
            color: #cbd5e1;
            font-size: 0.8rem;
            line-height: 1.4;
        }

        .philosophy {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .concept {
            background: #334155;
            padding: 1rem;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #475569;
        }

        .concept-icon {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }

        .concept h4 {
            color: #f1f5f9;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .concept p {
            color: #94a3b8;
            font-size: 0.75rem;
            line-height: 1.3;
        }

        .actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
            margin-bottom: 1rem;
        }

        .btn {
            padding: 0.6rem 1.2rem;
            border-radius: 6px;
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 500;
            transition: all 0.2s ease;
            border: none;
            cursor: pointer;
        }

        .btn-primary {
            background: #3b82f6;
            color: white;
        }

        .btn-primary:hover {
            background: #2563eb;
        }

        .btn-secondary {
            background: #475569;
            color: #e2e8f0;
            border: 1px solid #64748b;
        }

        .btn-secondary:hover {
            background: #64748b;
        }

        .warning {
            background: #7c2d12;
            border: 1px solid #ea580c;
            color: #fed7aa;
            padding: 0.75rem;
            border-radius: 6px;
            font-size: 0.8rem;
            text-align: center;
        }

        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }
            
            .header {
                padding: 1.5rem;
            }
            
            .header h1 {
                font-size: 1.5rem;
            }
            
            .content {
                padding: 1rem;
            }
            
            .steps {
                grid-template-columns: 1fr;
            }
            
            .philosophy {
                grid-template-columns: 1fr;
            }
            
            .actions {
                flex-direction: column;
                align-items: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Your Dashboard</h1>
        </div>

        <div class="content">
            <div class="philosophy">
                <div class="concept">
                    <div class="concept-icon">🧩</div>
                    <h4>Everything is a Page</h4>
                    <p>Docs, chats, folders, AI—same structure</p>
                </div>
                <div class="concept">
                    <div class="concept-icon">🌳</div>
                    <h4>Everything Nests</h4>
                    <p>Context flows up, permissions down</p>
                </div>
                <div class="concept">
                    <div class="concept-icon">💬</div>
                    <h4>@Mention Anything</h4>
                    <p>Inject context into AI conversations</p>
                </div>
            </div>

            <div class="quick-start">
                <h2>Get Started in 4 Steps</h2>
                <div class="steps">
                    <div class="step">
                        <h3><span class="step-number">1</span>Explore your drive</h3>
                        <p>Drives are where you organize your knowldge. You already have a personal drive. Enter it to create pages and create additional ones for more projects.</p>
                    </div>
                    <div class="step">
                        <h3><span class="step-number">2</span>Select your AI</h3>
                        <p>Deepseek-r1:8b is the default but if you want better performance, bring your own API key in your AI settings. It works with almost any model.</p>
                    </div>
                    <div class="step">
                        <h3><span class="step-number">3</span>Create a document</h3>
                        <p>Ask your AI Assistant in write mode to draft and edit your document. Now you can edit your document as a rich text file!</p>
                    </div>
                        <div class="step">
                        <h3><span class="step-number">4</span>Edit this page?</h3>
                        <p>This is a vibe page that you can also create inside of your drives. Your AI assistant can edit it for you, or you can edit the HTML/CSS yourself to make your pages and dashboards whatever you need them to be.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parse(cookieHeader || '');
    const accessToken = cookies.accessToken;

    if (!accessToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const decoded = await decodeToken(accessToken);
    if (!decoded) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = decoded.userId;

    let dashboard = await db.query.userDashboards.findFirst({
      where: eq(userDashboards.userId, userId),
    });

    if (!dashboard) {
      const [newDashboard] = await db.insert(userDashboards).values({
        userId,
        content: defaultDashboardContent,
      }).returning();
      dashboard = newDashboard;
    }

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Failed to get dashboard layout:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parse(cookieHeader || '');
    const accessToken = cookies.accessToken;

    if (!accessToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const decoded = await decodeToken(accessToken);
    if (!decoded) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = decoded.userId;

    const body = await req.json();
    const { content } = patchSchema.parse(body);

    const [updatedDashboard] = await db.update(userDashboards)
      .set({ content, updatedAt: new Date() })
      .where(eq(userDashboards.userId, userId))
      .returning();

    if (!updatedDashboard) {
        // If the user doesn't have a dashboard, create one
        const [newDashboard] = await db.insert(userDashboards).values({
            userId,
            content,
        }).returning();
        return NextResponse.json(newDashboard);
    }

    return NextResponse.json(updatedDashboard);
  } catch (error) {
    console.error('Failed to update dashboard layout:', error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}