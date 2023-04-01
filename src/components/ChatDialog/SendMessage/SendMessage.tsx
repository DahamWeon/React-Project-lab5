/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role */
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  UploadTaskSnapshot,
} from '@firebase/storage';
import { db } from '@/firebase/app';
import { storage } from '@/firebase/storage';
import classes from './SendMessage.module.scss';
import { AuthContext } from '@/context/AuthContext';
import { FormEvent, KeyboardEvent, useContext, useState } from 'react';
import Img from '/public/assets/chatImagePlaceholder.svg';
import { collection, addDoc, serverTimestamp } from '@firebase/firestore';

export function SendMessage() {
  const { currentUser } = useContext(AuthContext);

  const [input, setInput] = useState('');
  const [img, setImg] = useState(null);

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (input === '') {
      alert('메시지를 입력하세요');
      return;
    }

    const { uid, displayName } = currentUser;
    if (img) {
      const uniqueId = img.name;
      const storageRef = ref(storage, `assets/${uniqueId}`);
      const uploadTask = uploadBytesResumable(storageRef, img);

      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          console.error(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
            await addDoc(collection(db, 'messages'), {
              text: input,
              name: displayName,
              uid,
              createdAt: serverTimestamp(),
              photoURL: downloadURL,
            });
          });
        }
      );
    } else {
      await addDoc(collection(db, 'messages'), {
        text: input,
        name: displayName,
        uid,
        createdAt: serverTimestamp(),
      });
    }

    setInput('');
    setImg(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLLabelElement>) => {
    if (e.key === 'Enter') {
      const fileInput = document.getElementById('file') as HTMLInputElement;
      fileInput.click();
    }
  };

  return (
    <form className={classes.input} onSubmit={handleSendMessage}>
      <div className={classes.sendInput}>
        <label htmlFor="message" className="a11yHidden">
          메세지 입력
        </label>
        <input
          type="text"
          name="text"
          id="message"
          value={input}
          aria-label="메시지 입력"
          placeholder="메시지를 입력하세요."
          onChange={(e) => setInput(e.target.value)}
          required
        />
      </div>

      <div className={classes.sendBtn}>
        <input
          type="file"
          id="file"
          name="file"
          accept="image/*"
          onChange={(e) => setImg(e.target.files[0])}
          aria-label="이미지 업로드 버튼"
          tabIndex={-1}
        />
        <label
          htmlFor="file"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          role="button"
          aria-label="이미지 업로드 버튼"
        >
          <img src={Img} alt="이미지 업로드 버튼" />
        </label>
        <button type="submit" aria-label="메세지 보내기 버튼">
          ⌲
        </button>
      </div>
    </form>
  );
}
