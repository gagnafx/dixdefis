export type Challenge = {
  id: number;
  title: string;
  rewardFcfa: number;
  completed: boolean;
};

export const CHALLENGE_SEEDS = [
  { id: 1, title: "Rouleaux du Destin", rewardFcfa: 1000 },
  { id: 2, title: "Jauge Dorée", rewardFcfa: 1200 },
  { id: 3, title: "Rouleaux Précis", rewardFcfa: 1400 },
  { id: 4, title: "Jauge Mouvante", rewardFcfa: 1600 },
  { id: 5, title: "Rouleaux Rapides", rewardFcfa: 1800 },
  { id: 6, title: "Jauge Piégée", rewardFcfa: 2000 },
  { id: 7, title: "Rouleaux Extrêmes", rewardFcfa: 2300 },
  { id: 8, title: "Jauge Erratique", rewardFcfa: 2600 },
  { id: 9, title: "Boss : Rouleaux + Jauge", rewardFcfa: 3000 },
  { id: 10, title: "Jauge Finale", rewardFcfa: 5000 }
] as const;