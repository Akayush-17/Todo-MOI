import React, { useEffect, useState } from "react";
import { VoyageProvider, Wallet, getLogicDriver } from 'js-moi-sdk';
import { info, success } from "./utils/toastWrapper";
import { Toaster } from "react-hot-toast";
import Loader from "./components/Loader";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

// ------- Update with your credentials ------------------ //
const logicId = "0x080000dcaecf10966be28514a7aa7b3c9ebaf71dc8a5eafbe9a5f16e947ecce41c23ee"
const mnemonic = "finish focus animal virus banana blade milk diagram result ozone castle excite"

const logicDriver = await gettingLogicDriver(
  logicId,
  mnemonic,
  "m/44'/6174'/7020'/0/0"
)

async function gettingLogicDriver(logicId, mnemonic, accountPath) {
  const provider = new VoyageProvider("babylon")
  const wallet = new Wallet(provider)
  await wallet.fromMnemonic(mnemonic, accountPath)
  return await getLogicDriver(logicId, wallet)
}

function App() {
  const [todoName, setTodoName] = useState("");
  const [todos, setTodos] = useState([]);
  const { transcript, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setTodoName(transcript);
      resetTranscript();
    }
  }, [transcript]);

  const startListening = (e) => {
    e.preventDefault();  // Prevent default form submission
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopListening = (e) => {
    e.preventDefault();  // Prevent default form submission
    SpeechRecognition.stopListening();
    if (transcript) {
      setTodoName(transcript);
      resetTranscript();
    }
  };

  // ...

  const handleVoiceInput = () => {
    if (SpeechRecognition.browserSupportsSpeechRecognition()) {
      return (
        <>
          <button onClick={startListening} type="button" className="voice-input-btn">
            Start Voice Input
          </button>
          <button onClick={stopListening} type="button" className="voice-input-btn">
            Stop Voice Input
          </button>
        </>
      );
    }
    return <div>Speech recognition not supported on this browser</div>;
  };

  // Loaders
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    getTodos();
  }, []);

  const handleTodoName = (e) => {
    setTodoName(e.currentTarget.value);
  };

  const getTodos = async () => {
    try {
      const tTodos = await logicDriver.persistentState.get("todos")
      setTodos(tTodos)
      setLoading(false);
    } catch (error) {
      setLoading(false)
      console.log(error);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    try {
      setAdding(true)
      info("Adding Todo ...");
      
      const ix = await logicDriver.routines.Add([todoName]).send({
        fuelPrice: 1,
        fuelLimit: 1000,
      });

      // Waiting for tesseract to be mined
      await ix.wait()
      
      await getTodos()
      success("Successfully Added");
      setTodoName("")
      setAdding(false)
    } catch (error) {
      console.log(error);
    }
  };

  const markCompleted = async (id) => {
    try {
      setMarking(id)
      const ix = await logicDriver.routines.MarkTodoCompleted([id]).send({
        fuelPrice: 1,
        fuelLimit: 1000,
      });
      // Waiting for tesseract to be mined
      await ix.wait();
      
      const tTodos = [...todos];
      tTodos[id].completed = true;
      setTodos(tTodos);
      setMarking(false)
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Toaster />
      <section class="section-center">
        <form class="todo-form">
          <p class="alert"></p>
          <h3>Voice command based Todo buddy</h3>
          <div class="form-control">
            <input
              value={todoName}
              name="todoName"
              onChange={handleTodoName}
              type="text"
              id="todo"
              placeholder="e.g. Attend Moi Event"
            />
            <button onClick={add} type="submit" class="submit-btn">
            {adding ? <Loader color={"#000"} loading={adding} /> :"Add Todo"}
            </button>
          </div>
          <div className="voice-input">
        {handleVoiceInput()}
      </div>
        </form>
        {!loading ? <div class="todo-container show-container">
          {todos.map((todo, index) => {
            return (
              <div class="todo-list">
                {todo.name}
                {todo.completed ? (
                  <img className="icon" src="/images/check.svg" />
                ) : (
                  <span
                    onClick={() => markCompleted(index)}
                    className="underline text-red pointer"
                  >
                    {marking === index? <Loader color={"#000"} loading={marking === 0 ? true:marking} /> :"Mark Completed!"}
                  </span>
                )}
              </div>
            );
          })}
        </div> 
        : 
        <div style={{marginTop:"20px"}}>
          <Loader color={"#000"} loading={loading} />  
        </div>}
      </section>
    </>
  );
}

export default App;
