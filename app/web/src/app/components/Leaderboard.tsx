import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";

const mockLeaderboard = [
  {
    rank: 1,
    username: "DataDriven",
    accuracy: "78%",
    points: 4280,
    isCurrentUser: false,
  },
  {
    rank: 2,
    username: "PredictPro",
    accuracy: "75%",
    points: 3950,
    isCurrentUser: false,
  },
  {
    rank: 3,
    username: "You",
    accuracy: "72%",
    points: 3620,
    isCurrentUser: true,
  },
  {
    rank: 4,
    username: "MarketWatcher",
    accuracy: "71%",
    points: 3410,
    isCurrentUser: false,
  },
  {
    rank: 5,
    username: "ForecastMaster",
    accuracy: "69%",
    points: 3210,
    isCurrentUser: false,
  },
  {
    rank: 6,
    username: "AnalysisKing",
    accuracy: "68%",
    points: 2980,
    isCurrentUser: false,
  },
  {
    rank: 7,
    username: "TrendTracker",
    accuracy: "67%",
    points: 2750,
    isCurrentUser: false,
  },
  {
    rank: 8,
    username: "InsightHunter",
    accuracy: "65%",
    points: 2490,
    isCurrentUser: false,
  },
];

export default function Leaderboard() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Weekly Leaderboard</h1>
          <p className="text-muted-foreground mt-2">
            Top predictors based on accuracy and total points
          </p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Top Predictors
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-0">
              {mockLeaderboard.map((entry, idx) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-4 border-b border-border last:border-b-0 ${
                    entry.isCurrentUser ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl font-bold text-muted-foreground w-8 text-right">
                      {entry.rank === 1 && <span className="text-lg">🥇</span>}
                      {entry.rank === 2 && <span className="text-lg">🥈</span>}
                      {entry.rank === 3 && <span className="text-lg">🥉</span>}
                      {entry.rank > 3 && <span>{entry.rank}</span>}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {entry.username}
                        {entry.isCurrentUser && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {entry.accuracy} accuracy
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-lg text-primary">
                      {entry.points.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
