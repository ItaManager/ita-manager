"use client";

import { Users, Briefcase, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function TableauDeBord() {
  // Données pour Total Employés
  const totalEmployeesData = [
    { name: "Permanents", value: 42, color: "#1d186c" },
    { name: "Contractuels", value: 18, color: "#b45309" },
    { name: "Journaliers", value: 85, color: "#7c3aed" },
  ];

  // Données Performance Équipe
  const performanceData = [
    { mois: "Jan", score: 65 },
    { mois: "Fév", score: 72 },
    { mois: "Mar", score: 68 },
    { mois: "Avr", score: 78 },
    { mois: "Mai", score: 82 },
    { mois: "Juin", score: 85 },
    { mois: "Juil", score: 88 },
  ];

  const totalEmployees = totalEmployeesData.reduce((sum, item) => sum + item.value, 0);

  // Données démo employés
  const employees = [
    { id: 1, nom: "Kouassi Jean", poste: "Ingénieur Civil", service: "Travaux", statut: "Actif", entree: "2023-01-15" },
    { id: 2, nom: "Diallo Fatou", poste: "Comptable", service: "Finance", statut: "Actif", entree: "2022-06-10" },
    { id: 3, nom: "Traoré Amadou", poste: "Chef de Chantier", service: "Travaux", statut: "Actif", entree: "2021-03-20" },
    { id: 4, nom: "N'Guessan Marie", poste: "RH Manager", service: "RH", statut: "Actif", entree: "2020-09-01" },
    { id: 5, nom: "Koné Ibrahim", poste: "Conducteur", service: "Logistique", statut: "Congé", entree: "2023-07-12" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-semibold mb-1">Bonjour, Armel 👋</h2>
        <p className="text-muted-foreground text-sm">Voici votre tableau de bord RH</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Employés Permanents</div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#13850b' }}>
              <Users className="size-5 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">42</div>
          <div className="flex items-center gap-1 text-xs text-success">
            <span>↑ 5.14%</span>
            <span className="text-muted-foreground">vs mois dernier</span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Contractuels</div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Briefcase className="size-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">18</div>
          <div className="flex items-center gap-1 text-xs text-red-600">
            <span>↓ 12.2%</span>
            <span className="text-muted-foreground">vs mois dernier</span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Journaliers</div>
            <div className="w-10 h-10 rounded-full bg-warning-soft flex items-center justify-center">
              <Clock className="size-5 text-warning" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">85</div>
          <div className="flex items-center gap-1 text-xs text-success">
            <span>↑ 8.3%</span>
            <span className="text-muted-foreground">vs mois dernier</span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">En Congé</div>
            <div className="w-10 h-10 rounded-full bg-review-soft flex items-center justify-center">
              <Calendar className="size-5 text-review" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">12</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>8.3% de l'effectif</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Employés Donut */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Répartition Employés</h3>
            <select className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background cursor-pointer">
              <option>Cette année</option>
              <option>Ce mois</option>
              <option>Tout</option>
            </select>
          </div>

          <div className="relative h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totalEmployeesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {totalEmployeesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-4xl font-bold">{totalEmployees}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            {totalEmployeesData.map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
                <div className="text-xl font-bold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Line Chart */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Performance Équipe</h3>
            <select className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background cursor-pointer">
              <option>7 derniers mois</option>
              <option>12 derniers mois</option>
              <option>Cette année</option>
            </select>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mois" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#1d186c"
                strokeWidth={2}
                dot={{ fill: "#1d186c", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">Employés Récents</h3>
          <div className="flex items-center gap-3">
            <select className="text-sm border border-border rounded-lg px-3 py-2 bg-background cursor-pointer">
              <option>Tous les services</option>
              <option>Travaux</option>
              <option>Finance</option>
              <option>RH</option>
              <option>Logistique</option>
            </select>
            <select className="text-sm border border-border rounded-lg px-3 py-2 bg-background cursor-pointer">
              <option>Tous les statuts</option>
              <option>Actif</option>
              <option>Congé</option>
              <option>Inactif</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nom</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Poste</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Service</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date d'entrée</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: '#13850b' }}>
                        {emp.nom.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="font-medium">{emp.nom}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{emp.poste}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{emp.service}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={emp.statut === "Actif" ? "default" : "secondary"}
                      className={emp.statut === "Actif" ? "bg-success-soft text-success" : ""}
                    >
                      {emp.statut}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{emp.entree}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
