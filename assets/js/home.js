(function($, PM, Account) {
  if (location.href.indexOf('wall') > 0) return;

  PM.tilt.init();

  PM.bgm = new PM.BGM($('#bgm-audio'), {
    src: '/audios/bgm.mp3',
    autoplay: true
  });

  var slick = $('.gallery').slick({
    arrows: false,
    infinite: true,
    speed: 500,
    fade: true,
    cssEase: 'linear',
    autoplay: true,
    autoplaySpeed: 4000,
    lazyLoad: 'ondemand'
  }).on('afterChange', function(e, slick, index) {
    var $img = $(slick.$slides[index]).find('img').addClass('disable-tilt');
    PM.tilt.pause();
    PM.tilt.setTilt($img.data('tiltObj').reset()).update();
    PM.tilt.play();
    $img.removeClass('disable-tilt');
  }).slick('getSlick');

  if (slick.$slides) {
    slick.$slides.find('img').each(function() {
      $(this).data('tiltObj', new PM.Tilt($(this)));
    });

    // update first when init
    PM.tilt.setTilt($(slick.$slides[0]).find('img').data('tiltObj')).update();
    $(slick.$slides[0]).find('img').removeClass('disable-tilt');
  }

  $('#btn-back').on('tap', function(e) {
    $('#pnl-fullpage .slide').removeClass('slideup');
    e.preventDefault();
  });

  $('#btn-map').on('tap', function(e) {
    var $btn = $(this);
    if ($btn.hasClass('weui_btn_disabled')) {
      return;
    }
    $btn.addClass('weui_btn_disabled');
      $('#pnl-fullpage .slide').addClass('slideup');

    PM.map.open().always(function() {
      $btn.removeClass('weui_btn_disabled');
    });
    e.preventDefault();
  });

  $('#btn-wish').on('tap', function(e) {
    $('#btn-group').removeClass('dock-show').addClass('dock-hide');
    $('#wish-box').removeClass('dock-hide').addClass('dock-show');
    e.preventDefault();
  });

  $('#btn-close-wish').on('tap', function(e) {
    $('#ipt-wish').blur();
    $('#wish-box').removeClass('dock-show').addClass('dock-hide');
    $('#btn-group').removeClass('dock-hide').addClass('dock-show');
    e.preventDefault();
  });

  $('#btn-checkin').on('tap', function(e) {
    var mask = $('#checkin-mask');
    var weuiActionsheet = $('#checkin-actionsheet');
    var remainDays = Math.floor((new Date(2016, 9, 5) - new Date())/(24*3600*1000));
    if (remainDays > 0) {
      weuiActionsheet.find('[data-status="present"]').addClass('disabled').find('small').html('还有' + remainDays + '天');
    }
    if (Account.lastCheckin && Account.lastCheckin.status) {
      weuiActionsheet.find('[data-status="' + Account.lastCheckin.status + '"]').addClass('disabled').find('small').html('已签到');
    }
    weuiActionsheet.addClass('weui_actionsheet_toggle');
    mask.show()
      .focus()
      .addClass('weui_fade_toggle').one('tap', function (e) {
        hideActionSheet(weuiActionsheet, mask);
        e.preventDefault();
      });

    weuiActionsheet.one('tap', 'a', function (e) {
      if ($(this).data('status') && !$(this).hasClass('disabled')) {
        PM.request({
          url: '/home/api_checkin',
          type: 'POST',
          data: {
            accountID: Account.accountID,
            status: $(this).data('status')
          }
        }).then(function(checkin) {
          Account.lastCheckin = checkin;
          PM.toast(checkin.status == 'absent' ? '实在太遗憾了' : '恭候您的光临', 3000);
        });
      }

      hideActionSheet(weuiActionsheet, mask);
      e.preventDefault();
    });
    mask.off('transitionend').off('webkitTransitionEnd');

    PM.tilt.disable();

    function hideActionSheet(weuiActionsheet, mask) {
        weuiActionsheet.removeClass('weui_actionsheet_toggle');
        mask.removeClass('weui_fade_toggle');
        mask.on('transitionend webkitTransitionEnd', function () {
          weuiActionsheet.find('[data-status]').removeClass('disabled').find('small').empty();
          mask.hide();
          PM.tilt.enable();
        });
    }

    e.preventDefault();
  });

  var getPlaceholder = (function() {
    var last = 0;

    return function() {
      var ps = [
        '为我们送上祝福吧',
        '来，在这输入，我带你飞',
        '听说你知道新郎的秘密',
        '听说你知道新娘的秘密',
        '来不及解释了，快上车',
        '颜值高的和祝福多的都有机会中奖',
        '让祝福飞一会儿',
        '执子之手，与子一起抢红包',
        '天将降红包于斯人也',
        '百年好合，红包大额'
      ];
      var curr = last;

      while (true) {
        curr = Math.floor(Math.random()*ps.length);
        if (curr != last) {
          break;
        }
      }

      last = curr;
      return ps[curr];
    };
  }());

  $('#ipt-wish').fittextarearows(1, 5).on('focus', function() {
    PM.tilt.disable();
  }).on('blur', function() {
    PM.tilt.enable();
    $(this).attr('placeholder', getPlaceholder());
  }).on('touchmove touchstart', function (e) {
      e.stopPropagation();
  }).attr('placeholder', getPlaceholder());

  $('#btn-send-wish').on('tap', function(e) {
    e.preventDefault();
    var $t = $(this);
    var $ipt = $('#ipt-wish');
    var msg = $.trim($ipt.val());
    if ($t.prop('disabled') || !msg) {
      return;
    }

    $t.prop('disabled', true);

    function haskey(text) {
      var keywords = ['习近平', '党', '丑', '猥琐', '龌蹉', '死', '逼'] // 数组存放敏感关键词

      for (var i = 0; i < keywords.length; i++) {
        var reg = new RegExp(keywords[i], 'gi')
        if (text.match(reg)) {
          return true
        }
      }
      return false
    }
    //敏感词限制
    if (haskey(msg)) {
      $ipt.val('').blur();
      PM.toast('请注意用语~', 3000);
      return
    }

    PM.request({
      url: '/home/api_wish',
      type: 'POST',
      data: {
        accountID: Account.accountID,
        msg: msg
      }
    }).then(function(wish) {
      $ipt.val('').blur();
      // PM.board.pendingMsg.push(wish);
      PM.toast('感谢您的祝福~', 3000);
    }).always(function() {
      $t.prop('disabled', false);
    });


  });

  $('.fullpage').on('touchmove', function(e) {
    e.preventDefault();
  });

  if ($('#wish-board').size() > 0) {
    PM.poller.poll();
    PM.board.init($('#wish-board'));
  }

  wx.ready(function() {
    $('#bgm-audio').click()
    PM.bgm.play()
  });

}(jQuery, PM, Account));


