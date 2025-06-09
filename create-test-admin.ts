/**
 * Script para criar um usuário admin de teste via API REST
 * Para testar a funcionalidade do botão "Seguir"
 */

async function createTestAdmin() {
  try {
    console.log('Criando usuário admin de teste via API...');
    
    // Tentar registrar via API REST
    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'Admin Teste',
        email: 'admin.teste@designparaestetica.com',
        password: '123456'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Usuário admin de teste criado com sucesso:');
      console.log('Username:', result.username);
      console.log('Email:', result.email);
      console.log('ID:', result.id);
      console.log('Senha: 123456');
      
      // Agora tornar o usuário admin via SQL direto
      const adminResponse = await fetch('http://localhost:5000/api/admin/users/' + result.id, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAdmin: true,
          bio: 'Usuário admin criado para testes da funcionalidade de seguir.'
        })
      });
      
      if (adminResponse.ok) {
        console.log('✅ Usuário promovido a admin com sucesso!');
      }
      
      console.log('\nAgora você pode fazer logout do Jean Carlos e entrar com:');
      console.log('Email: admin.teste@designparaestetica.com');
      console.log('Senha: 123456');
      
    } else if (response.status === 400) {
      console.log('⚠️ Usuário admin de teste já existe.');
      console.log('Email: admin.teste@designparaestetica.com');
      console.log('Senha: 123456');
    } else {
      console.error('❌ Erro ao criar usuário:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin de teste:', error);
  }
}

createTestAdmin();