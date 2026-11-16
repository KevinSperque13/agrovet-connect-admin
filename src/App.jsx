import { useEffect, useState } from "react";
import { supabase, supabaseConfigError } from "./services/supabase";
import Login from "./Login";

import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Package,
  ShoppingCart,
  CalendarDays,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  PawPrint,
  LogOut
} from "lucide-react";

import "./App.css";

const menu = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Veterinários", icon: Stethoscope },
  { name: "Clientes", icon: Users },
  { name: "Produtos", icon: Package },
  { name: "Vendas", icon: ShoppingCart },
  { name: "Agenda", icon: CalendarDays },
  { name: "Relatórios", icon: BarChart3 },
  { name: "Configurações", icon: Settings }
];

function Dashboard() {
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [organizationId, setOrganizationId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customerError, setCustomerError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const filteredCustomers = customers.filter((customer) => {
  const search = customerSearch.toLowerCase().trim();

  return (
    customer.name?.toLowerCase().includes(search) ||
    customer.phone?.toLowerCase().includes(search) ||
    customer.document?.toLowerCase().includes(search)
  );
});


  // 1. Buscar a empresa do usuário conectado
  useEffect(() => {
    async function loadOrganization() {
      try {
        setCustomerError("");

        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) throw userError;

        if (!userData.user) {
          throw new Error("Usuário não autenticado.");
        }

        const { data, error } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", userData.user.id)
          .single();

        if (error) throw error;

        setOrganizationId(data.organization_id);
      } catch (error) {
        console.error("Erro ao buscar empresa:", error.message);
        setCustomerError(error.message);
      }
    }

    loadOrganization();
  }, []);

  // 2. Buscar os clientes da empresa
  useEffect(() => {
    if (!organizationId) return;

    async function loadCustomers() {
      setLoadingCustomers(true);
      setCustomerError("");

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar clientes:", error.message);
        setCustomerError(error.message);
        setCustomers([]);
      } else {
        setCustomers(data || []);
      }

      setLoadingCustomers(false);
    }

    loadCustomers();
  }, [organizationId]);

  


  useEffect(() => {
  async function loadUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Erro ao buscar usuário:", error.message);
      return;
    }

    setCurrentUser(data.user);
  }

  loadUser();
}, []);

async function handleLogout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Erro ao sair:", error.message);
    alert("Não foi possível sair do sistema.");
  }
}


  const [connectionStatus, setConnectionStatus] = useState(
    supabaseConfigError || "Testando conexão..."
  );

  useEffect(() => {
    if (!supabase) return;

    async function testConnection() {
      try {
        const { error } = await supabase
          .from("organizations")
          .select("id")
          .limit(1);

        if (error) {
          console.error("Erro Supabase:", error.message);
          setConnectionStatus("Erro na conexão: " + error.message);
        } else {
          console.log("Supabase conectado com sucesso!");
          setConnectionStatus("Supabase conectado com sucesso!");
        }
      } catch (error) {
        console.error("Erro Supabase:", error);
        setConnectionStatus("Erro ao conectar ao Supabase.");
      }
    }

    testConnection();
  }, []);

  const [active, setActive] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const stats = [
    { title: "Clientes cadastrados", value: "0", icon: Users },
    { title: "Veterinários", value: "0", icon: Stethoscope },
    { title: "Produtos", value: "0", icon: Package },
    { title: "Vendas do mês", value: "R$ 0,00", icon: ShoppingCart }
  ];

    
async function handleCreateCustomer(event) {

  event.preventDefault();

  if (!organizationId) {
    alert("Empresa não identificada.");
    return;
  }

  if (!customerName.trim()) {
    alert("Informe o nome do cliente.");
    return;
  }

  setSavingCustomer(true);
  setCustomerError("");

  const customerData = {
    organization_id: organizationId,
    name: customerName.trim(),
    phone: customerPhone.trim() || null,
    email: customerEmail.trim() || null,
    document: customerDocument.trim() || null,
    contact_name: customerContact.trim() || null,
    city: customerCity.trim() || null,
    state: customerState.trim() || null,
    notes: customerNotes.trim() || null
  };

  let data;
  let error;

  if (editingCustomer) {
    const result = await supabase
      .from("customers")
      .update(customerData)
      .eq("id", editingCustomer.id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    data = result.data;
    error = result.error;
  } else {
    const result = await supabase
      .from("customers")
      .insert(customerData)
      .select()
      .single();

    data = result.data;
    error = result.error;
  }

  setSavingCustomer(false);

  if (error) {
    console.error("Erro ao salvar cliente:", error.message);
    setCustomerError(error.message);
    return;
  }

  if (editingCustomer) {
    setCustomers((previous) =>
      previous.map((customer) =>
        customer.id === data.id ? data : customer
      )
    );
    alert("Cliente atualizado com sucesso!");
  } else {
    setCustomers((previous) => [data, ...previous]);
    alert("Cliente cadastrado com sucesso!");
  }

  setCustomerName("");
  setCustomerPhone("");
  setCustomerEmail("");
  setCustomerDocument("");
  setCustomerContact("");
  setCustomerCity("");
  setCustomerState("");
  setCustomerNotes("");

  setEditingCustomer(null);
  setShowCustomerForm(false);
}

    function handleEditCustomer(customer) {
    setEditingCustomer(customer);

    setCustomerName(customer.name || "");
    setCustomerPhone(customer.phone || "");
    setCustomerEmail(customer.email || "");
    setCustomerDocument(customer.document || "");
    setCustomerContact(customer.contact_name || "");
    setCustomerCity(customer.city || "");
    setCustomerState(customer.state || "");
    setCustomerNotes(customer.notes || "");

    setShowCustomerForm(true);
}

  async function handleDeleteCustomer(customer) {
  const confirmed = window.confirm(
    `Tem certeza que deseja excluir o cliente ${customer.name}?`
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customer.id)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Erro ao excluir cliente:", error.message);
    alert("Não foi possível excluir o cliente.");
    return;
  }

  setCustomers((previous) =>
    previous.filter((item) => item.id !== customer.id)
  );

  alert("Cliente excluído com sucesso!");
}

  return (
    <div className="app">
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <PawPrint size={26} />
          </div>
          <div>
            <h2>AgroVet</h2>
            <span>CONNECT</span>
          </div>
        </div>

        <p className="menu-label">MENU PRINCIPAL</p>

        <nav>
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  active === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActive(item.name);
                  setMobileMenu(false);
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <button className="sidebar-bottom" onClick={handleLogout}type="button">
          <LogOut size={18} />
          <span>Sair do sistema</span>
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <Menu />
          </button>

          <div className="breadcrumb">
            AgroVet Connect / <strong>{active}</strong>
          </div>

          <div className="top-actions">
            <button className="notification">
              <Bell size={20} />
            </button>
            <div className="avatar">A</div>
              <div className="user-info">
                <strong>Administrador</strong>
                <span>{currentUser?.email || "Carregando..."}</span>
              </div>
          </div>
        </header>

        <section className="content">
          <div className="welcome">
            <div>
              <span className="eyebrow">PAINEL ADMINISTRATIVO</span>
              <h1>{active}</h1>
              <p>
                Bem-vindo ao gerenciamento da sua empresa AgroVet Connect.
              </p>
            </div>
            <div className="date">
              <CalendarDays size={18} />
              Gestão integrada
            </div>
          </div>

          <div
            className={`connection-status ${
              connectionStatus.startsWith("Supabase conectado")
                ? "success"
                : connectionStatus === "Testando conexão..."
                  ? "pending"
                  : "error"
            }`}
            role="status"
          >
            {connectionStatus}
          </div>

          {active === "Clientes" ? (
            <div className="panel">
              <h3>Clientes cadastrados</h3>
              <input type="text"className="customer-search"placeholder="Pesquisar por nome, telefone ou CPF/CNPJ..."value={customerSearch}onChange={(e) => setCustomerSearch(e.target.value)}/>
              <p>Clientes vinculados à empresa AgroVet Connect.</p>
              <div className="customer-actions">
                <button
                  className="btn-primary"
                  onClick={() => setShowCustomerForm(true)}
                >
                  + Novo Cliente
                </button>
              </div>

              {showCustomerForm && (
                <form
                  className="customer-form"
                  onSubmit={handleCreateCustomer}
                >
                  <h3>Novo cadastro de cliente</h3>

                  <div className="form-grid">
                    <input
                      placeholder="Nome do cliente *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />

                    <input
                      placeholder="Nome do contato"
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                    />

                    <input
                      placeholder="Telefone / WhatsApp"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />

                    <input
                      type="email"
                      placeholder="E-mail"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />

                    <input
                      placeholder="CPF / CNPJ"
                      value={customerDocument}
                      onChange={(e) => setCustomerDocument(e.target.value)}
                    />

                    <input
                      placeholder="Cidade"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                    />

                    <input
                      placeholder="Estado (UF)"
                      maxLength={2}
                      value={customerState}
                      onChange={(e) => setCustomerState(e.target.value.toUpperCase())}
                    />
                  </div>

                  <textarea
                    placeholder="Observações"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={3}
                  />

                  {customerError && (
                    <p className="form-error">{customerError}</p>
                  )}

                  <div className="form-buttons">
                    <button type="submit" disabled={savingCustomer}>
                      {savingCustomer ? "Salvando..." : "Salvar Cliente"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCustomerForm(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {loadingCustomers ? (
                <p>Carregando clientes...</p>
              ) : customerError ? (
                <p style={{ color: "red" }}>{customerError}</p>
              ) : filteredCustomers.length === 0 ? (
                <div className="empty-state">
                  <Users size={38} />
                  <strong>Nenhum cliente cadastrado</strong>
                  <span>Os clientes cadastrados aparecerão aqui.</span>
                </div>
              ) : (
                <div className="customers-list">
                  
              {customers.map((customer) => (
                <div className="customer-item" key={customer.id}>
                  <strong>{customer.name}</strong>

                  <span>{customer.contact_name || "Sem contato informado"}</span>

                  <span>{customer.phone || "Sem telefone"}</span>

                  <span>
                    {[customer.city, customer.state].filter(Boolean).join(" - ") || "Localização não informada"}
                  </span>

                  <span>{customer.status === "active" ? "Ativo" : customer.status}</span>
                  <div className="customer-actions">
                    <button type="button"onClick={() => handleEditCustomer(customer)}>
                      Editar
                    </button>

                    <button type="button"className="delete-button"onClick={() => handleDeleteCustomer(customer)}>
                      Excluir
                    </button>
                  </div>
                </div>
                  )
                )
              }

                </div>
              )}
            </div>
          ) : active === "Dashboard" ? (
            <>
              <div className="stats">
                {stats.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div className="stat-card" key={item.title}>
                      <div className="stat-icon">
                        <Icon size={23} />
                      </div>
                      <span>{item.title}</span>
                      <h2>{item.value}</h2>
                    </div>
                  );
                })}
              </div>

              <div className="panel-grid">
                <div className="panel">
                  <h3>Visão geral</h3>
                  <p>
                    Seus indicadores aparecerão aqui quando os dados reais
                    estiverem conectados.
                  </p>
                  <div className="empty-state">
                    <BarChart3 size={38} />
                    <strong>Sem movimentações registradas</strong>
                    <span>Comece cadastrando seus clientes e produtos.</span>
                  </div>
                </div>

                <div className="panel">
                  <h3>Acesso rápido</h3>
                  <button onClick={() => setActive("Clientes")}>
                    <Users size={19} /> Gerenciar clientes
                  </button>
                  <button onClick={() => setActive("Veterinários")}>
                    <Stethoscope size={19} /> Gerenciar veterinários
                  </button>
                  <button onClick={() => setActive("Produtos")}>
                    <Package size={19} /> Gerenciar produtos
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="panel section-placeholder">
              <div className="stat-icon">
                <Search size={25} />
              </div>
              <h3>Módulo {active}</h3>
              <p>
                Esta área está preparada para receber as funcionalidades
                do sistema.
              </p>
              <span>Próxima fase: integração com o Supabase.</span>
            </div>
          )}

          <footer>
            AgroVet Connect © 2026 · Sistema de gestão veterinária
          </footer>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Erro ao verificar sessão:", error.message);
      }

      if (mounted) {
        setSession(data?.session ?? null);
        setCheckingSession(false);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setCheckingSession(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return <p style={{ padding: 30 }}>Verificando acesso...</p>;
  }

  if (!session) {
    return <Login />;
  }

  return <Dashboard />;
}
