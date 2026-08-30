import type { Book } from '../types';
import { generateCover } from './cover-generator';
import { hashArrayBuffer } from './utils';

export async function createDemoBooks(): Promise<Book[]> {
  const sample1Text = `Capítulo 1: Do título

Uma noite destas, vindo da cidade para o Engenho Novo, encontrei no trem da Central um rapaz aqui do bairro, que eu conheço de vista e de chapéu. Cumprimentou-me, sentou-se ao pé de mim, falou da lua e dos ministros, e acabou recitando-me versos. A viagem era curta, e os versos pode ser que não fossem inteiramente maus. Sucedeu, porém, que, como eu estava cansado, fechei os olhos três ou quatro vezes; tanto bastou para que ele interrompesse a leitura e metesse os versos no bolso.

— Continue, disse eu acordando.
— Já acabei, murmurou ele.
— São muito bonitos.

Vi-lhe fazer um gesto para tirá-los outra vez do bolso, mas não passou do gesto; estava amuado. No dia seguinte entrou a dizer de mim nomes feios, e acabou alcunhando-me Dom Casmurro. Os vizinhos, que não gostam dos meus hábitos reclusos e calados, deram curso à alcunha, que afinal pegou. Nem por isso me zanguei. Contei a anedota aos amigos da cidade, e eles, por graça, chamam-me assim, alguns em bilhetes: "Dom Casmurro, domingo vou jantar com você."

Não consulteis dicionários. Casmurro não está aqui no sentido que eles lhe dão, mas no que lhe pôs o vulgo de homem calado e metido consigo. Dom veio por ironia, para atribuir-me fumos de fidalgo. Tudo por estar cochilando! Também não achei melhor título para a minha narração; se não tiver outro daqui até ao fim do livro, vai este mesmo. O meu poeta do trem ficará sabendo que não lhe guardo rancor. E com pequeno esforço, sendo o título seu, poderá cuidar que a obra é sua. Há livros que apenas terão isso dos seus autores; alguns nem tanto.

Capítulo 2: Do princípio

Agora que expliquei o título, passo a escrever o livro. Antes disso, porém, digamos os motivos que me põem a pena na mão.

Vivo só, com um criado. A casa em que moro é própria; fi-la construir de propósito, levado de um desejo tão particular que me vexa imprimi-lo, mas vá lá. Um dia, há bastantes anos, lembrou-me reproduzir no Engenho Novo a casa em que me criei na antiga Rua de Matacavalos, dando-lhe o mesmo aspecto e a mesma economia daquela outra, que desapareceu. Construtor e pintor entenderam bem as indicações que lhes dei: é o mesmo prédio de um andar, três janelas de frente, varanda ao fundo, as mesmas alcovas e salas. Na principal das salas, a pintura do teto e das paredes é mais ou menos igual: umas grinaldas de flores miúdas e grandes pássaros que as seguram nos bicos de espaço a espaço. Nos quatro cantos do teto as figuras das quatro estações, e ao centro das paredes os retratos de César, Augusto, Nero e Massinissa, com os seus nomes por baixo... Não me recordo por que carga de água eram esses os quatro personagens.`;

  const encoder = new TextEncoder();
  const buffer1 = encoder.encode(sample1Text).buffer;
  const hash1 = await hashArrayBuffer(buffer1);

  const sample2Text = `Capítulo 1: A Cartomante

Hamlet observa a Horácio que há mais cousas no céu e na terra do que sonha a nossa vã filosofia. Era a mesma explicação que dava a bela Rita ao moço Camilo, numa sexta-feira de novembro de 1869, quando este ria dela, por ter ido na véspera consultar uma cartomante; a diferença é que o fazia por outras palavras.

— Ria, ria. Os homens são assim; não acreditam em nada. Pois fui, e ela adivinhou tudo antes que eu dissesse uma palavra. Apenas começou a botar as cartas, disse-me: "A senhora gosta de uma pessoa..." Confessei que sim, e então ela continuou a botar as cartas, combinou-as, e no fim declarou-me que eu tinha medo de que você me esquecesse, mas que não era verdade...

— Errou! interrompeu Camilo, rindo.

— Não diga isso, Camilo. Se você soubesse como eu tenho andado aflita, por sua causa. Você sabe; já lhe disse. Não ria de mim, não ria...

Camilo pegou-lhe nas mãos, e olhou para ela sério e fixo. Jurou que lhe queria muito, que os seus sustos pareciam de criança; em todo o caso, quando tivesse algum receio, a melhor cartomante era ele mesmo. Depois, repreendeu-a; disse-lhe que era imprudente andar por essas casas. Vilela podia saber, e depois...

— Qual saber! tive muita cautela, ao entrar na casa.
— Onde é a casa?
— Aqui perto, na Rua da Guarda-Velha; não passava ninguém na ocasião. Descansa; eu não sou tola.

Camilo riu outra vez:
— Tu crês deveras nessas cousas? perguntou-lhe.

Foi então que ela, sem saber que traduzia Hamlet em vulgar, disse-lhe que havia muita cousa misteriosa e verdadeira neste mundo. Se ele não acreditava, paciência; mas o certo é que a mulher adivinhara tudo. Que mais? A prova é que ela agora estava tranqüila e satisfeita.`;

  const buffer2 = encoder.encode(sample2Text).buffer;
  const hash2 = await hashArrayBuffer(buffer2);

  return [
    {
      id: 'demo-dom-casmurro',
      title: 'Dom Casmurro',
      author: 'Machado de Assis',
      genre: 'Clássico Brasileiro',
      tags: ['Clássico', 'Realismo', 'Literatura Brasileira'],
      coverUrl: generateCover('Dom Casmurro', 'Machado de Assis'),
      fileHash: hash1,
      fileData: buffer1,
      format: 'txt',
      totalChapters: 2,
      estimatedPages: 6,
      status: 'reading',
      dateAdded: Date.now() - 3600000 * 24 * 2,
      lastAccessed: Date.now() - 3600000 * 2,
      collections: ['Favoritos', 'Clássicos'],
    },
    {
      id: 'demo-a-cartomante',
      title: 'A Cartomante',
      author: 'Machado de Assis',
      genre: 'Conto',
      tags: ['Conto', 'Mistério', 'Literatura'],
      coverUrl: generateCover('A Cartomante', 'Machado de Assis'),
      fileHash: hash2,
      fileData: buffer2,
      format: 'txt',
      totalChapters: 1,
      estimatedPages: 4,
      status: 'unread',
      dateAdded: Date.now() - 3600000 * 24,
      lastAccessed: Date.now() - 3600000 * 24,
      collections: ['Contos'],
    },
  ];
}
