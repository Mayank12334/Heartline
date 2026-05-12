const API = "http://localhost:5000";
    const token = sessionStorage.getItem("token");
    const params = new URLSearchParams(window.location.search);
    let currentPostId = params.get("id");
    const msg = document.getElementById("msg");
    const editorValidation = document.getElementById("editorValidation");
    const titleInput = document.getElementById("title");
    const contentInput = document.getElementById("content");
    const titleCount = document.getElementById("titleCount");
    const wordCount = document.getElementById("wordCount");
    const readTime = document.getElementById("readTime");
    const storyStatus = document.getElementById("storyStatus");
    const editorHeading = document.getElementById("editorHeading");
    const editorSubtitle = document.getElementById("editorSubtitle");
    const publishButton = document.getElementById("publishButton");
    let loadedPost = null;

    if (!token) {
      window.location.href = "login.html";
    }

    function setMessage(text, isSuccess) {
      msg.textContent = text || "";
      msg.classList.toggle("success", Boolean(isSuccess));
    }

    function setValidationMessage(text) {
      editorValidation.innerHTML = text ? `<strong>Almost there:</strong> ${text}` : "";
      editorValidation.classList.toggle("active", Boolean(text));
    }

    function updateStats() {
      const title = titleInput.value.trim();
      const content = contentInput.value.trim();
      const words = content ? content.split(/\s+/).filter(Boolean).length : 0;
      const minutes = words ? Math.max(1, Math.ceil(words / 180)) : 0;

      titleCount.textContent = `${title.length} char${title.length === 1 ? "" : "s"}`;
      wordCount.textContent = `${words} word${words === 1 ? "" : "s"}`;
      readTime.textContent = `${minutes} min`;
    }

    function handlePublish(event) {
      event.preventDefault();
      submitArticle("published");
    }

    function saveDraft() {
      submitArticle("draft");
    }

    function setEditorMode(post) {
      loadedPost = post || null;
      const isEditing = Boolean(loadedPost);
      editorHeading.textContent = isEditing ? "Refine your article" : "Create a new article";
      editorSubtitle.textContent = isEditing
        ? "Update the story, save it back to drafts, or publish the latest version."
        : "Shape the headline, write the body, and decide whether to publish now or save it as a draft.";
      publishButton.textContent = isEditing ? "Update & Publish" : "Publish Post";
      storyStatus.textContent = loadedPost?.status === "published" ? "Published" : "Drafting";
    }

    async function loadExistingPost() {
      if (!currentPostId) {
        setEditorMode(null);
        return;
      }

      const res = await fetch(`${API}/api/posts/${currentPostId}`, {
        headers: {
          "Authorization": "Bearer " + token
        }
      });
      const data = await res.json();

      if (!data.post) {
        setMessage(data.message || "We could not open this article.", false);
        return;
      }

      titleInput.value = data.post.title === "Untitled Article" ? "" : data.post.title;
      contentInput.value = data.post.content || "";
      storyStatus.textContent = data.post.status === "published" ? "Published" : "Drafting";
      setEditorMode(data.post);
      updateStats();
    }

    async function submitArticle(status) {
      const title = titleInput.value.trim();
      const content = contentInput.value.trim();

      setValidationMessage("");

      if (status === "published" && (!title || !content)) {
        setValidationMessage("Add both a title and the article content before publishing.");
        return;
      }

      if (status === "draft" && !title && !content) {
        setValidationMessage("Write at least a title or a little content before saving a draft.");
        return;
      }

      const endpoint = currentPostId ? `${API}/update-post/${currentPostId}` : `${API}/create-post`;
      const method = currentPostId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ title, content, status })
      });

      const data = await res.json();
      const success = data.message && (
        data.message.toLowerCase().includes("success") ||
        data.message.toLowerCase().includes("saved") ||
        data.message.toLowerCase().includes("updated")
      );
      setMessage(data.message || "We could not publish your article right now.", success);

      if (success) {
        if (status === "published") {
          window.location.replace(sessionStorage.getItem("dashboardPath") || "user.html");
          return;
        }

        storyStatus.textContent = "Drafting";
        if (!currentPostId && data.postId) {
          currentPostId = data.postId;
          window.history.replaceState({}, "", `create-article.html?id=${currentPostId}`);
        }
      }
    }

    titleInput.addEventListener("input", updateStats);
    contentInput.addEventListener("input", updateStats);
    updateStats();
    setEditorMode(null);
    loadExistingPost();


