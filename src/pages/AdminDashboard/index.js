import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import RealTimeStats from '../RealTimesStats/index';
import './styles.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filters, setFilters] = useState({ status: '', setor: '', date: '' });
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showInProgressMessage, setShowInProgressMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);

  useEffect(() => {
    document.body.classList.add('admin-background');
    return () => {
      document.body.classList.remove('admin-background');
    };
  }, []);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await api.get('/form/list', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setTickets(response.data);
      } catch (error) {
      }
    };

    fetchTickets();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/signin');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem('authToken');
      const ticket = tickets.find(ticket => ticket.id === id);
      if (!ticket) {
        return;
      }
      await api.patch(`/form/update/${id}`, {
        ...ticket,
        status
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTickets(tickets.map(ticket => (ticket.id === id ? { ...ticket, status } : ticket)));
      setSelectedTicket(null);
      if (status === 'ANDAMENTO') {
        setShowInProgressMessage(true);
      }
    } catch (error) {
      if (error.response) {
      }
    }
  };

  const handleResolveTicket = async (id, message) => {
    if (message.length < 10) {
      setErrorMessage('A mensagem deve ter no mínimo 10 caracteres.');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const ticket = tickets.find(ticket => ticket.id === id);
      if (!ticket) {
        return;
      }
      await api.patch(`/form/update/${id}`, {
        ...ticket,
        status: 'RESOLVIDO',
        mensagem: message
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTickets(tickets.map(ticket => (ticket.id === id ? { ...ticket, status: 'RESOLVIDO' } : ticket)));
      setSelectedTicket(null);
      setShowMessageModal(false);
      setMessage('');
      setErrorMessage('');
      setShowSuccessMessage(true);
    } catch (error) {
      if (error.response) {
      }
    }
  };

  const handleDeleteTicket = (id) => {
    setSelectedTicket(tickets.find(ticket => ticket.id === id));
    setShowDeleteConfirmationModal(true);
  };

  const confirmDeleteTicket = async () => {
    if (selectedTicket) {
      try {
        const token = localStorage.getItem('authToken');
        await api.delete(`/form/delete/${selectedTicket.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setTickets(tickets.filter(ticket => ticket.id !== selectedTicket.id));
        setShowDeleteConfirmationModal(false);
        setSelectedTicket(null);
        alert('Ticket excluído com sucesso!');
      } catch (error) {;
        if (error.response) {
          alert(`Erro: ${error.response.data.message || 'Não foi possível excluir o ticket'}`);
        } else {
          alert('Erro inesperado ao excluir o ticket.');
        }
      }
    }
  };

  const handleRejectTicket = (id) => {
    setSelectedTicket(tickets.find(ticket => ticket.id === id));
    setMessage('');
    setErrorMessage('');
    setShowMessageModal(true);
  };

  const handleGoToUserList = () => {
    navigate('/users');
  };

  const filteredTickets = tickets.filter(ticket => {
    const ticketDate = new Date(ticket.dataCriacao).toISOString().split('T')[0];
    return (
      (filters.status === '' || ticket.status === filters.status) &&
      (filters.setor === '' || ticket.setor.toLowerCase().includes(filters.setor.toLowerCase())) &&
      (filters.date === '' || ticketDate === filters.date)
    );
  });

  const parseDate = (dateString) => {
    if (!dateString) return 'Data inválida';
    try {
      const formattedDate = dateString.replace(' ', 'T');
      const date = new Date(formattedDate);
      return date.toLocaleString();
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <div className="admin-dashboard">
      <RealTimeStats />
      <button className="logout-button" onClick={handleLogout}>Logout</button>
      <button className="user-list-button" onClick={handleGoToUserList}>Visualizar Usuarios</button>
      <div className="content">
        <div className="main-content">
          <div className="filters">
            <label>
              Status:
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">Todos</option>
                <option value="PENDENTE">PENDENTE</option>
                <option value="ANDAMENTO">ANDAMENTO</option>
                <option value="RESOLVIDO">RESOLVIDO</option>
              </select>
            </label>
            <label>
              Setor:
              <input type="text" name="setor" value={filters.setor} onChange={handleFilterChange} placeholder="Setor responsável" />
            </label>
            <label>
              Data:
              <input type="date" name="date" value={filters.date} onChange={handleFilterChange} />
            </label>
          </div>
          <div className="ticket-list">
            <h2>Lista de Tickets</h2>
            <ul>
              {filteredTickets.map(ticket => (
                <li
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={selectedTicket && selectedTicket.id === ticket.id ? 'selected' : ''}
                >
                  {ticket.id} - {ticket.motivo} - {ticket.status} - {parseDate(ticket.dataCriacao)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {selectedTicket && (
          <div className="ticket-details">
            <h2>Detalhes do Ticket</h2>
            <p>ID: {selectedTicket.id}</p>
            <p>Motivo: {selectedTicket.motivo}</p>
            <p>Setor: {selectedTicket.setor}</p>
            <p>Problema: {selectedTicket.problema}</p>
            <p>Status: {selectedTicket.status}</p>
            <p>Data de Criação: {parseDate(selectedTicket.dataCriacao)}</p>
            <button className="close" onClick={() => setSelectedTicket(null)}>Fechar</button>
            <button className="delete" onClick={() => handleDeleteTicket(selectedTicket.id)}>Excluir ticket</button>
            <button className="resolve" onClick={() => handleStatusChange(selectedTicket.id, 'ANDAMENTO')}>Marcar como em andamento</button>
            <button className="delete" onClick={() => handleRejectTicket(selectedTicket.id)}>Marcar como resolvido</button>
          </div>
        )}
      </div>
      {showMessageModal && (
        <div id="modal-admin-msg">
          <div id="modal-admin-msg-content">
            <h3>Enviar Mensagem</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite a mensagem para o usuário (mínimo 10 caracteres)"
              rows="4"
              cols="50"
            />
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <button onClick={() => { setShowMessageModal(false); setMessage(''); setErrorMessage(''); }}>Fechar</button>
            <button onClick={() => handleResolveTicket(selectedTicket.id, message)}>Confirmar mensagem e enviar</button>
          </div>
        </div>
      )}
      {showSuccessMessage && (
        <div className="success-message-overlay">
          <div className="success-message-content">
            <h3>Mensagem enviada com sucesso!</h3>
            <button onClick={() => setShowSuccessMessage(false)}>Voltar</button>
          </div>
        </div>
      )}
      {showInProgressMessage && (
        <div className="success-message-overlay">
          <div className="success-message-content">
            <h3>Status do ticket alterado para Em andamento com sucesso!</h3>
            <button onClick={() => setShowInProgressMessage(false)}>Fechar</button>
          </div>
        </div>
      )}
      {showDeleteConfirmationModal && (
        <div id="delete-confirmation-modal">
          <div id="delete-confirmation-modal-content">
            <p>Tem certeza que deseja excluir este ticket?</p>
            <button id="btn-confirmar-delete" onClick={confirmDeleteTicket}>Confirmar</button>
            <button id="btn-voltar" onClick={() => setShowDeleteConfirmationModal(false)}>Voltar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;