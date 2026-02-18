// main/functions/league-data.js
const { neon } = require('@neondatabase/serverless');

// Handler for all league data operations
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Initialize Neon connection
    const sql = neon(process.env.DATABASE_URL);
    
    const { httpMethod, path, body } = event;
    const parsedBody = body ? JSON.parse(body) : {};

    // GET: Fetch all league data
    if (httpMethod === 'GET') {
      const [leagueData] = await sql`
        SELECT * FROM league_state 
        WHERE id = 1
      `;

      if (!leagueData) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'No data found. Please initialize database.' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          version: leagueData.version,
          teams: leagueData.teams,
          fixtures: leagueData.fixtures,
          players: leagueData.players,
          announcements: leagueData.announcements,
          messages: leagueData.messages,
          tactics: leagueData.tactics,
          squads: leagueData.squads,
          startingXI: leagueData.starting_xi,
          teamchat: leagueData.teamchat,
          extraTeams: leagueData.extra_teams || []
        })
      };
    }

    // POST: Save/update all league data
    if (httpMethod === 'POST') {
      const {
        version,
        teams,
        fixtures,
        players,
        announcements,
        messages,
        tactics,
        squads,
        startingXI,
        teamchat,
        extraTeams
      } = parsedBody;

      await sql`
        INSERT INTO league_state (
          id, version, teams, fixtures, players, announcements, 
          messages, tactics, squads, starting_xi, teamchat, extra_teams, 
          updated_at
        ) VALUES (
          1, ${version}, ${JSON.stringify(teams)}, ${JSON.stringify(fixtures)}, 
          ${JSON.stringify(players)}, ${JSON.stringify(announcements)},
          ${JSON.stringify(messages)}, ${JSON.stringify(tactics)}, 
          ${JSON.stringify(squads)}, ${JSON.stringify(startingXI)}, 
          ${JSON.stringify(teamchat)}, ${JSON.stringify(extraTeams || [])},
          NOW()
        )
        ON CONFLICT (id) 
        DO UPDATE SET
          version = EXCLUDED.version,
          teams = EXCLUDED.teams,
          fixtures = EXCLUDED.fixtures,
          players = EXCLUDED.players,
          announcements = EXCLUDED.announcements,
          messages = EXCLUDED.messages,
          tactics = EXCLUDED.tactics,
          squads = EXCLUDED.squads,
          starting_xi = EXCLUDED.starting_xi,
          teamchat = EXCLUDED.teamchat,
          extra_teams = EXCLUDED.extra_teams,
          updated_at = EXCLUDED.updated_at
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Data saved successfully' })
      };
    }

    // DELETE: Reset to defaults
    if (httpMethod === 'DELETE') {
      await sql`DELETE FROM league_state WHERE id = 1`;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Data reset. Will use defaults on next load.' })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
