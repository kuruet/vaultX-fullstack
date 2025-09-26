import React from "react";
// import FileUploader from "./components/FileUploader";
import UploadPage from "./components/UploadPage";
import DownloadPage from "./components/DownloadPage";
import { BrowserRouter as Router , Routes, Route} from "react-router-dom"

function App() {
  return (
     
    <Router>
    <Routes>
      <Route path="/" element={<UploadPage/>}/>
      <Route path="/download" element={<DownloadPage/>}/>
    </Routes>
    </Router>
  );
}

export default App;
