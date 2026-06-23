export type PreviousWinner = {
  rank: number;
  teamName: string;
  memberCount: number;
  totalJudges: number;
  averageScore: number;
  totalScore: number;
};

export const previousCoffeeCodeWinners: PreviousWinner[] = [
  { rank: 1, teamName: 'karak tea', memberCount: 5, totalJudges: 5, averageScore: 41, totalScore: 205 },
  { rank: 2, teamName: 'expresso', memberCount: 5, totalJudges: 5, averageScore: 35.8, totalScore: 179 },
  { rank: 3, teamName: 'iced coffee', memberCount: 5, totalJudges: 5, averageScore: 34.2, totalScore: 171 },
  { rank: 4, teamName: 'mocha', memberCount: 5, totalJudges: 5, averageScore: 34.2, totalScore: 171 },
  { rank: 5, teamName: 'matcha coffee', memberCount: 5, totalJudges: 5, averageScore: 30.2, totalScore: 151 }
];
