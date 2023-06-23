var HC = window.HC || {};
HC.templates = {};
HC.utils = HC_Utils();

Vue.options.delimiters = ['{[{', '}]}'];

/*===================================================
 * GLOBAL VARIABLES
 *=================================================*/

// Fetch and set local settings
HC.DC = null;
HC.LOCALE = HC.utils.getLocale(window.location.pathname);


/*===================================================
 * COMPONENTS
 *=================================================*/

// ICON COMPONENT
Vue.component("v-icon", {
  template: "<img v-if='iconUrl' :src='iconUrl' class='v-icon' />",
  props: ["id"],
  data() {
    return {
      identifier: 0
    }
  },
  computed: {
    iconUrl: function() {
      var category = _.find(HC.SETTINGS.categories,function(category){
        return category.id && category.id.trim() == this.id || this.identifier;
      }.bind(this));

      return category ? category.icon : false;
    },
  },
  mounted: function() {
    if (!this.id ) {
      this.identifier = HC.utils.getCategoryId()
    }
  }
});

// ICON COMPONENT
Vue.component("v-form-icon", {
  template: "<img v-if='iconUrl' :src='iconUrl' class='v-icon' />",
  props: ["id"],
  computed: {
    iconUrl: function() {
      var form = _.find(HC.SETTINGS.forms,function(form){
        return form.id && form.id.trim() == this.id;
      }.bind(this));

      return form ? form.icon : false;
    },
  },
});



/*=========================================================
 * PAGE: HEADER
 *========================================================= */

HC.templates.header = new Vue({
  data: {
    showMenu: false
  }
});


/*=========================================================
 * PAGE: FOOTER
 *========================================================= */

HC.templates.cta = new Vue({
  data: {
    isHomePage: false,
    isCategoryPage: false,
    isArticlePage: false,
    categoryIdentifier: ""
  },
  mounted: function() {
    if (HC.SETTINGS.isHomePage) this.isHomePage = true;
    if (HC.SETTINGS.isCategoryPage) {
      this.isCategoryPage = true;
      this.mapCategoryString(this.getCategoryURL());
    } 
    if (HC.SETTINGS.isArticlePage) {
      this.isArticlePage = true;
      this.mapCategoryString(this.getCategoryURL());
    } 
  },
  methods: {
    getCategoryURL: function() {
      var categoryID = HC.utils.getCategoryId()
      console.log(categoryID);
      if (categoryID) {
        // this.categoryIdentifier = categoryID;
        return categoryID;
      }
    },
  	mapCategoryString: function(categoryID) {
      this.categoryIdentifier = HC.SETTINGS.category_mapping[categoryID];
    }
  }
});

HC.templates.backToTop = new Vue({
  data: {
    visible: false,
  },
  mounted: function() {
    console.log('working')
    window.onscroll = () => {
      this.evaluateVisibility()
    };
  },
  methods: {
    evaluateVisibility: function() {
      if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        this.visible = true
      } else {
        this.visible = false
      }
    },
    scrollToTop: function() {
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }
  }
});


/*=========================================================
 * PAGE: HOME
 *========================================================= */

HC.templates.home = new Vue({
  data: {
    defaultGroupName: "Other",
    sidebarCategories: [],
    categoryGroupMap: {}
  },
  mounted: function() {
    console.log('groups', HC.SETTINGS.category_groups)
    this.categoryGroupMap = HC.SETTINGS.category_groups
		const groups = Object.keys(this.categoryGroupMap)
    console.log(groups)
    groups.forEach((group, idx) => {
      if (group && this.categoryGroupMap[group]) {
        $('.category-groups').append(`<div class="category-group-${idx + 1}"><h2 class="category-group-title">${group}</h2><ul class="blocks-list"></ul></div>`)
        const grouping = $(`.category-group-${idx + 1} .blocks-list`)
        for (let categoryId of this.categoryGroupMap[group]) {
          grouping.append($(`li[data-id="${categoryId}"]`))
        }
      }
    })
    console.log($('.blocks-list.misc').children())
    if ($('.blocks-list.misc').children().length)  {
      $('.blocks-list.misc').before(`<h2 class="category-group-title">${this.defaultGroupName}</h2>`)
    }
    
    
    if (this.sidebarCategories) {
      const special = $('.special-categories .blocks-list')
      this.sidebarCategories.forEach(categoryId => {
        special.append($(`li[data-id="${categoryId}"]`))
      })
    }

    
    
  },
  methods: {
		
  }
});


/*=========================================================
 * PAGE: CATEGORY
 *========================================================= */

HC.templates.category = new Vue();

/*=========================================================
 * PAGE: SECTION
 *========================================================= */

HC.templates.section = new Vue();


/*=========================================================
 * PAGE: ARTICLE
 *========================================================= */

HC.templates.article = new Vue({
  data: {
    showFeedbackForm: false,
    feedbackOptions: [],
    feedbackSubmitted: false,
    feedbackSelectedOption: null,
    feedbackDetails: "",
    categoryIdentifier: ""
  },
  mounted: function() {
    this.getFeedbackOptions();

    // Show/hide feedback form based on voting status
    $(".article-vote").on("click", function(e) {
      var target = $(e.target);
      var isDownvote = target.hasClass("article-vote-down") && target.attr("aria-selected") == "false";
      this.showFeedbackForm = isDownvote;
    }.bind(this));
    
    this.mapCategoryString(this.getCategoryURL());
  },
  methods: {
    getFeedbackOptions: function() {
      _.each(HC.SETTINGS.feedback_options,function(option){
        if (option.tag && option.label && option.tag.trim().length && option.label.trim().length) {
          this.feedbackOptions.push(option);
        }
      }.bind(this));
    },

    submitFeedback: function() {
      var data = {request: {}};
      var articleTitle = $(".article-title").text().trim();
      var articleUrl = window.location.href;
      var helpCenterTitle = $(".breadcrumbs li").first().text().trim();

      data.request = {
        ticket_form_id: HC.SETTINGS.feedback_form_id,
        requester: {name: "Anonymous", email: "anonymous@example.com"},
        subject: helpCenterTitle + " Article Feedback: " + articleTitle,
        comment: {body: this.feedbackDetails || "N/A"},
        tags: ["hc_feedback"],
        custom_fields: [
          {id: HC.SETTINGS.feedback_field_id_title, value: articleTitle},
          {id: HC.SETTINGS.feedback_field_id_url, value: articleUrl},
          {id: HC.SETTINGS.feedback_field_id_reason, value: this.feedbackSelectedOption},
        ]
      };

      this.submitRequest(data);
      this.feedbackSubmitted = true;
    },

    submitRequest: function(data) {
      $.ajax({
        url: 'https://corelogic.zendesk.com/api/v2/requests.json',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        type: 'POST',
        data: JSON.stringify(data)
      })
      .done(function(data) {
        console.log(data.request.id);
        console.log(data);
      })
      .fail(function(error) {
        console.log(error);
      });
    },
    
    getCategoryURL: function() {
      var categoryID = HC.utils.getCategoryId()
      console.log(categoryID);
      if (categoryID) {
        // this.categoryIdentifier = categoryID;
        return categoryID;
      }
    },
  	mapCategoryString: function(categoryID) {
      this.categoryIdentifier = HC.SETTINGS.category_mapping[categoryID];
    }
  }
});


/*=========================================================
 * PAGE: SEARCH
 *========================================================= */

HC.templates.search = new Vue({
  mounted: function() {
    var isScoped = HC.utils.getUrlParameter("category");
    if (isScoped && isScoped.length) {
      $(".search-results-notice").show();
    } else {
      $(".search-results-notice").remove();
    }
  },
});


/*=========================================================
 * PAGE: NEW REQUEST
 *========================================================= */

HC.templates.new_request_header = new Vue({
  data: {
    isTicketForm: false,
  },
  mounted: function() {
    // Change breadcrumbs
    var breadcrumbTitle = "Get in Touch";
    $(".breadcrumbs li:nth-child(2)").attr("title", breadcrumbTitle).text(breadcrumbTitle);


    var ticketId = parseInt($('#request_issue_type_select').val());
    if (!isNaN(ticketId)) {
      this.isTicketForm = true;
      $(".form-sidebar").show();
    }
  }
});


HC.templates.new_request = new Vue({
  data: {
    // showForms: true,
    showChat: false,
    isChatAvailable: false,
    isTicketForm: false,
    forms: []
  },
  created: function() {
    this.checkChatStatus();
    this.onHashChange();
    // this.showForms = window.location.hash == '#forms';
  },
  mounted: function() {
    // Change breadcrumbs
    var breadcrumbTitle = "Get in Touch";
    $(".breadcrumbs li:nth-child(2)").attr("title", breadcrumbTitle).text(breadcrumbTitle);

    // Open by default if ticket id parameter or on request form error
    if (window.location.search.indexOf("ticket_form_id") > -1 ||
        window.location.pathname.indexOf("/new") == -1) {
      this.isTicketForm = true;
      this.displayFormTitle();
      $(".form-container").show();
      $(".form-sidebar").show();
    }

    this.getForms();
  },

  methods: {
    getForms: function() {
      that = this;
      $("#request_issue_type_select option").each(function(){
        var $option = $(this);
        var data = {
          id: $option.val(),
          title: $option.text(),
          url: $option.data("url"),
        };

        if (data.id != "-" && data.id != "360000033816" && data.id != "360001423675") that.forms.push(data);
      });
    },
		
    displayFormTitle: function() {
      var currentForm = $('#request_issue_type_select option:selected').text();
      $('.form-header-title').text(currentForm);
      console.log(currentForm);
    },
    // showFormOptions: function() {
    //   this.showForms = true;
    //   window.location.hash = "forms";
    // },

    getFormDescription: function(id) {
      var form = _.findWhere(HC.SETTINGS.forms, {id: id});
      return form ? (form.description || "") : ""
    },

    checkChatStatus: function() {
      that = this;
      $(document).ready(function() {
        zE('webWidget:on', 'chat:status', function(status) {
          console.log('This chat session is now', status);
          that.isChatAvailable = status == "online";
        });
      });
    },

    toggleChat: function(option) {
      $(document).ready(function() {
        if (!this.showChat && this.isChatAvailable) {
          zE('webWidget', 'show');
          zE('webWidget', 'open');
          this.showChat = true;
        } else if (!zE('webWidget:get', 'chat:isChatting')) {
          zE('webWidget', 'hide');
          this.showChat = false;
        }
      }.bind(this));
    },

    onHashChange: function() {
      that = this;
      window.onhashchange = function() {
        that.showForms = window.location.hash == '#forms';
      }
    }
  }
});

HC.templates.new_request_sidebar = new Vue({
  data: {
    isChatAvailable: false,
    showChat: false
  },
  mounted: function() {
    this.checkChatStatus();
  },
  methods: {
    checkChatStatus: function() {
      that = this;
      $(document).ready(function() {
        zE('webWidget:on', 'chat:status', function(status) {
          console.log('This chat session is now', status);
          that.isChatAvailable = status == "online";
        });
      });
    },
    toggleChat: function(option) {
      $(document).ready(function() {
        if (!this.showChat && this.isChatAvailable) {
          zE('webWidget', 'show');
          zE('webWidget', 'open');
          this.showChat = true;
        } else if (!zE('webWidget:get', 'chat:isChatting')) {
          zE('webWidget', 'hide');
          this.showChat = false;
        }
      }.bind(this));
    },
  }
});

/*=========================================================
 * UTILITY METHODS
 *========================================================= */

function HC_Utils() {
  return {
    getPageId: function(url) {
      var links = url.split("/"),
        result = links[links.length - 1];

      return parseInt(result, 10) || null;
    },

    getFormId: function() {
      var formVal = $("#request_issue_type_select").val(),
        formId = parseInt(formVal, 10);

      return isNaN(formId) ? null : formId;
    },

    getUrlParameter: function(name, url) {
      url = url || location.search;
      name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
      var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
      return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    },

    urlContains: function(url) {
      var path = window.location.href;
      return path.indexOf(url) > -1;
    },

    urlPathEndsWith: function(suffix) {
      var path = window.location.pathname;
      return this.endsWith(path, suffix);
    },

    endsWith: function(url, suffix) {
      return url.indexOf(suffix, url.length - suffix.length) !== -1;
    },

    getSectionId: function() {
      var sectionLink = $(".breadcrumbs li:nth-child(3) a");
      return sectionLink.length ? this.getPageId(sectionLink.attr("href")) : null;
    },

    getCategoryId: function() {
      if ($(".category-page").length) {
        return this.getPageId(window.location.href);
      } else {
        var categoryLink = $(".breadcrumbs li:nth-child(2) a");
        return categoryLink.length ? this.getPageId(categoryLink.attr("href")) : null;
      }
    },

    getLocale: function(url) {
      var links = url.split("/"),
        hcIndex = links.indexOf("hc"),
        links2 = links[hcIndex + 1].split("?"),
        locale = links2[0];

      return locale;
    },

  };
}




document.addEventListener('DOMContentLoaded', function() {
  function closest (element, selector) {
    if (Element.prototype.closest) {
      return element.closest(selector);
    }
    do {
      if (Element.prototype.matches && element.matches(selector)
        || Element.prototype.msMatchesSelector && element.msMatchesSelector(selector)
        || Element.prototype.webkitMatchesSelector && element.webkitMatchesSelector(selector)) {
        return element;
      }
      element = element.parentElement || element.parentNode;
    } while (element !== null && element.nodeType === 1);
    return null;
  }
  
 if (document.querySelector('body').classList.contains('new-request-page') && HC.utils.urlContains('ticket_form_id')) {
  
    // make subject article suggestions _target=none
    const targetNode = document.querySelector('.suggestion-list');

    // Options for the observer (which mutations to observe)
    const config = { attributes: true, childList: true, subtree: true };

    // Callback function to execute when mutations are observed
    const callback = function(mutationsList, observer) {
      for(const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          var target = mutation.target
          if (target = "div.searchbox-suggestions") {
            var element = document.querySelector(target);
            if (element.childNodes.length) {
              var articleLinks = element.children[0].getElementsByTagName('a');
              for (let i = 0; i < articleLinks.length; i++) {
                articleLinks[i].target = '_blank';
              }
            } 
          }
        }
      }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
    
  }

  // social share popups
  Array.prototype.forEach.call(document.querySelectorAll('.share a'), function(anchor) {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      window.open(this.href, '', 'height = 500, width = 500');
    });
  });

  // In some cases we should preserve focus after page reload
  function saveFocus() {
    var activeElementId = document.activeElement.getAttribute("id");
    sessionStorage.setItem('returnFocusTo', '#' + activeElementId);
  }
  var returnFocusTo = sessionStorage.getItem('returnFocusTo');
  if (returnFocusTo) {
    sessionStorage.removeItem('returnFocusTo');
    var returnFocusToEl = document.querySelector(returnFocusTo);
    returnFocusToEl && returnFocusToEl.focus && returnFocusToEl.focus();
  }

  // show form controls when the textarea receives focus or backbutton is used and value exists
  var commentContainerTextarea = document.querySelector('.comment-container textarea'),
    commentContainerFormControls = document.querySelector('.comment-form-controls, .comment-ccs');

  if (commentContainerTextarea) {
    commentContainerTextarea.addEventListener('focus', function focusCommentContainerTextarea() {
      commentContainerFormControls.style.display = 'block';
      commentContainerTextarea.removeEventListener('focus', focusCommentContainerTextarea);
    });

    if (commentContainerTextarea.value !== '') {
      commentContainerFormControls.style.display = 'block';
    }
  }

  // Expand Request comment form when Add to conversation is clicked
  var showRequestCommentContainerTrigger = document.querySelector('.request-container .comment-container .comment-show-container'),
    requestCommentFields = document.querySelectorAll('.request-container .comment-container .comment-fields'),
    requestCommentSubmit = document.querySelector('.request-container .comment-container .request-submit-comment');

  if (showRequestCommentContainerTrigger) {
    showRequestCommentContainerTrigger.addEventListener('click', function() {
      showRequestCommentContainerTrigger.style.display = 'none';
      Array.prototype.forEach.call(requestCommentFields, function(e) { e.style.display = 'block'; });
      requestCommentSubmit.style.display = 'inline-block';

      if (commentContainerTextarea) {
        commentContainerTextarea.focus();
      }
    });
  }

  // Mark as solved button
  var requestMarkAsSolvedButton = document.querySelector('.request-container .mark-as-solved:not([data-disabled])'),
    requestMarkAsSolvedCheckbox = document.querySelector('.request-container .comment-container input[type=checkbox]'),
    requestCommentSubmitButton = document.querySelector('.request-container .comment-container input[type=submit]');

  if (requestMarkAsSolvedButton) {
    requestMarkAsSolvedButton.addEventListener('click', function () {
      requestMarkAsSolvedCheckbox.setAttribute('checked', true);
      requestCommentSubmitButton.disabled = true;
      this.setAttribute('data-disabled', true);
      // Element.closest is not supported in IE11
      closest(this, 'form').submit();
    });
  }

  // Change Mark as solved text according to whether comment is filled
  var requestCommentTextarea = document.querySelector('.request-container .comment-container textarea');

  if (requestCommentTextarea) {
    requestCommentTextarea.addEventListener('input', function() {
      if (requestCommentTextarea.value === '') {
        if (requestMarkAsSolvedButton) {
          requestMarkAsSolvedButton.innerText = requestMarkAsSolvedButton.getAttribute('data-solve-translation');
        }
        requestCommentSubmitButton.disabled = true;
      } else {
        if (requestMarkAsSolvedButton) {
          requestMarkAsSolvedButton.innerText = requestMarkAsSolvedButton.getAttribute('data-solve-and-submit-translation');
        }
        requestCommentSubmitButton.disabled = false;
      }
    });
  }

  // Disable submit button if textarea is empty
  if (requestCommentTextarea && requestCommentTextarea.value === '') {
    requestCommentSubmitButton.disabled = true;
  }

  // Submit requests filter form on status or organization change in the request list page
  Array.prototype.forEach.call(document.querySelectorAll('#request-status-select, #request-organization-select'), function(el) {
    el.addEventListener('change', function(e) {
      e.stopPropagation();
      saveFocus();
      closest(this, 'form').submit();
    });
  });

  // Submit requests filter form on search in the request list page
  var quickSearch = document.querySelector('#quick-search');
  quickSearch && quickSearch.addEventListener('keyup', function(e) {
    if (e.keyCode === 13) { // Enter key
      e.stopPropagation();
      saveFocus();
      closest(this, 'form').submit();
    }
  });

  function toggleNavigation(toggle, menu) {
    var isExpanded = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', !isExpanded);
    toggle.setAttribute('aria-expanded', !isExpanded);
  }

  function closeNavigation(toggle, menu) {
    menu.setAttribute('aria-expanded', false);
    toggle.setAttribute('aria-expanded', false);
    toggle.focus();
  }

  // var burgerMenu = document.querySelector('.header .menu-button');
  // var userMenu = document.querySelector('#user-nav');

  // burgerMenu.addEventListener('click', function(e) {
  //   e.stopPropagation();
  //   toggleNavigation(this, userMenu);
  // });


  // userMenu.addEventListener('keyup', function(e) {
  //   if (e.keyCode === 27) { // Escape key
  //     e.stopPropagation();
  //     closeNavigation(burgerMenu, this);
  //   }
  // });

  // if (userMenu.children.length === 0) {
  //   burgerMenu.style.display = 'none';
  // }

  // Toggles expanded aria to collapsible elements
  var collapsible = document.querySelectorAll('.collapsible-nav, .collapsible-sidebar');

  Array.prototype.forEach.call(collapsible, function(el) {
    var toggle = el.querySelector('.collapsible-nav-toggle, .collapsible-sidebar-toggle');

    el.addEventListener('click', function(e) {
      toggleNavigation(toggle, this);
    });

    el.addEventListener('keyup', function(e) {
      if (e.keyCode === 27) { // Escape key
        closeNavigation(toggle, this);
      }
    });
  });

  // Submit organization form in the request page
  var requestOrganisationSelect = document.querySelector('#request-organization select');

  if (requestOrganisationSelect) {
    requestOrganisationSelect.addEventListener('change', function() {
      closest(this, 'form').submit();
    });
  }

  // If a section has more than 6 subsections, we collapse the list, and show a trigger to display them all
  const seeAllTrigger = document.querySelector("#see-all-sections-trigger");
  const subsectionsList = document.querySelector(".section-list");

  if (subsectionsList && subsectionsList.children.length > 6) {
    seeAllTrigger.setAttribute("aria-hidden", false);

    seeAllTrigger.addEventListener("click", function(e) {
      subsectionsList.classList.remove("section-list--collapsed");
      seeAllTrigger.parentNode.removeChild(seeAllTrigger);
    });
  }

  // If multibrand search has more than 5 help centers or categories collapse the list
  const multibrandFilterLists = document.querySelectorAll(".multibrand-filter-list");
  Array.prototype.forEach.call(multibrandFilterLists, function(filter) {
    if (filter.children.length > 6) {
      // Display the show more button
      var trigger = filter.querySelector(".see-all-filters");
      trigger.setAttribute("aria-hidden", false);

      // Add event handler for click
      trigger.addEventListener("click", function(e) {
        e.stopPropagation();
        trigger.parentNode.removeChild(trigger);
        filter.classList.remove("multibrand-filter-list--collapsed")
      })
    }
  });

  // If there are any error notifications below an input field, focus that field
  const notificationElm = document.querySelector(".notification-error");
  if (
    notificationElm &&
    notificationElm.previousElementSibling &&
    typeof notificationElm.previousElementSibling.focus === "function"
  ) {
    notificationElm.previousElementSibling.focus();
  }
});
