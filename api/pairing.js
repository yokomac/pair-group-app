
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;
const BRANCH = process.env.GITHUB_BRANCH || "main";

const FILE_PATH = "data/pairing-history.json";

const API_URL =
  `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${TOKEN}`,
  "X-GitHub-Api-Version": "2022-11-28"
};

// GitHubからJSONを取得
async function getData() {
  const response = await fetch(
    `${API_URL}?ref=${encodeURIComponent(BRANCH)}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error("GitHub read error.");
  }

  const file = await response.json();

  return {
    sha: file.sha,
    data: JSON.parse(
      Buffer.from(file.content, "base64").toString("utf8")
    )
  };
}

// GitHubのJSONを更新
async function saveData(data, sha) {
  const content = Buffer.from(
    JSON.stringify(data, null, 2)
  ).toString("base64");

  const response = await fetch(API_URL, {
    method: "PUT",
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Update pairing history",
      content,
      sha,
      branch: BRANCH
    })
  });

  if (!response.ok) {
    throw new Error("GitHub save error.");
  }

  return response.json();
}

// 配列をランダムにシャッフル
function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// 過去のペアを識別するキー
function pairKey(a, b) {
  return [a, b].sort().join("|");
}

// 重複しないペアを生成
function createPairs(participants, history) {
  const usedPairs = new Set(
    history.flatMap(round =>
      round.pairs.map(pair => pairKey(...pair))
    )
  );

  function search(remaining) {
    if (remaining.length === 0) {
      return [];
    }

    const [first, ...rest] = remaining;

    for (const partner of shuffle(rest)) {
      const key = pairKey(first, partner);

      if (usedPairs.has(key)) continue;

      const next = rest.filter(
        person => person !== partner
      );

      const result = search(next);

      if (result !== null) {
        return [[first, partner], ...result];
      }
    }

    return null;
  }

  return search(shuffle(participants));
}

// API handler
export default async function handler(req, res) {
  try {
    if (!OWNER || !REPO || !TOKEN) {
      throw new Error("Missing environment variables.");
    }

    const { sha, data } = await getData();

    // 履歴の取得
    if (req.method === "GET") {
      return res.status(200).json(data);
    }

    // ペアの生成
    if (req.method === "POST") {

      // 7回完了していたらリセット
      if (data.round >= 7) {
        data.round = 0;
        data.history = [];
      }

      const pairs = createPairs(
        data.participants,
        data.history
      );

      if (!pairs) {
        return res.status(409).json({
          error: "No valid pairing available."
        });
      }

      data.round += 1;

      data.history.push({
        round: data.round,
        date: new Date().toISOString(),
        pairs
      });

      await saveData(data, sha);

      return res.status(200).json({
        round: data.round,
        pairs
      });
    }

    return res.status(405).json({
      error: "Method not allowed."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
}
