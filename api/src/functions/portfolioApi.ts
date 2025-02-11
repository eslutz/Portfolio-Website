import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const connectionString = process.env['COSMOS_CONNECTION_STRING'];
const databaseName = process.env['COSMOS_DATABASE_NAME'];
const containerName = process.env['COSMOS_CONTAINER_NAME'];

if (!connectionString || !databaseName || !containerName) {
  throw new Error('Required environment variables are not set. Check COSMOS_CONNECTION_STRING, COSMOS_DATABASE_NAME, and COSMOS_CONTAINER_NAME');
}

const client = new CosmosClient(connectionString);
const database = client.database(databaseName);
const container = database.container(containerName);

export async function getCosmosData(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const requestBody = await request.json() as { component: string };
    if (!requestBody?.component) {
      return {
        status: 400,
        body: JSON.stringify({ message: "Missing required 'component' in request body" })
      };
    }

    // Use parameterized query
    const query = {
      query: "SELECT * FROM c WHERE c.component = @componentName",
      parameters: [
        {
          name: "@componentName",
          value: requestBody.component
        }
      ]
    };

    const { resources: items } = await container.items
      .query(query)
      .fetchAll();

    if (items.length === 0) {
      return {
        status: 404,
        body: JSON.stringify({ message: `${requestBody.component} content not found` })
      };
    }

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(items)
    };
  } catch (error) {
    context.error('Error fetching content:', error);
    return {
      status: 500,
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
}

app.http('getCosmosData', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: getCosmosData,
});
